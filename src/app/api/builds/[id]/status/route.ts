import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const build = await AppBuild.findById(params.id);
    
    if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (build.user_id !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Localhost fallback: GitHub webhooks cannot reach localhost.
    // If we're on localhost and the build is still 'building', actively poll GitHub.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (build.status === 'building' && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
      try {
        const { ApiConfiguration } = await import('@/lib/models/ApiConfiguration');
        const githubConfig = await ApiConfiguration.findOne({ provider: 'github', is_active: true });
        
        if (githubConfig && githubConfig.config?.github_pat) {
          const { github_pat, repo_owner, repo_name, workflow_id } = githubConfig.config;
          const ghResponse = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/runs?per_page=5`, {
            headers: { 
              'Authorization': `token ${github_pat}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'AppForge-Builder'
            }
          });

          if (ghResponse.ok) {
            const data = await ghResponse.json();
            
            // Find the most recent completed run that started AFTER this build was created
            // If none found, just pick the latest run
            let targetRun = data.workflow_runs.find((run: any) => run.status === 'completed');
            
            if (targetRun && targetRun.status === 'completed') {
              if (targetRun.conclusion === 'success') {
                const artifactsRes = await fetch(targetRun.artifacts_url, {
                  headers: { 
                    'Authorization': `token ${github_pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AppForge-Builder'
                  }
                });
                
                if (artifactsRes.ok) {
                  const artifactsData = await artifactsRes.json();
                  if (artifactsData.artifacts && artifactsData.artifacts.length > 0) {
                    build.status = 'complete';
                    build.progress = 100;
                    build.download_url = `${baseUrl}/api/builds/${build._id}/download?artifact_id=${artifactsData.artifacts[0].id}`;
                    await build.save();
                  } else {
                    // Success but no artifact!
                    build.status = 'failed';
                    build.error_message = 'Build succeeded but no APK artifact was found. Check your GitHub Actions upload path.';
                    await build.save();
                  }
                }
              } else if (targetRun.conclusion === 'failure' || targetRun.conclusion === 'cancelled') {
                build.status = 'failed';
                build.error_message = `GitHub Actions build ${targetRun.conclusion}.`;
                await build.save();
              }
            }
          } else {
            console.error("Fallback GitHub API Error:", await ghResponse.text());
          }
        }
      } catch (err) {
        console.error("Local webhook fallback error:", err);
      }
    }

    return NextResponse.json({ 
      id: build._id,
      status: build.status,
      progress: build.progress,
      download_url: build.download_url,
      file_size_bytes: null,
      error_message: build.error_message,
      config: build.config
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}