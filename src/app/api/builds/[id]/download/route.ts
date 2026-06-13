import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
import { ApiConfiguration } from '@/lib/models/ApiConfiguration';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const build = await AppBuild.findById(params.id);
    if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const requestUrl = new URL(req.url);
    const artifactId = requestUrl.searchParams.get('artifact_id');

    if (artifactId) {
      const githubConfig = await ApiConfiguration.findOne({ provider: 'github', is_active: true });
      if (!githubConfig || !githubConfig.config?.github_pat) {
        return NextResponse.json({ error: 'GitHub Actions not configured' }, { status: 400 });
      }

      const { github_pat, repo_owner, repo_name } = githubConfig.config;
      
      const ghResponse = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}/actions/artifacts/${artifactId}/zip`, {
        headers: {
          'Authorization': `token ${github_pat}`,
          'User-Agent': 'AppForge-Builder',
          'Accept': 'application/vnd.github.v3+json'
        },
        redirect: 'follow'
      });

      if (!ghResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch artifact from GitHub' }, { status: ghResponse.status });
      }

      const headers = new Headers(ghResponse.headers);
      headers.set('Content-Disposition', `attachment; filename="${build.app_name}-build.zip"`);
      headers.set('Content-Type', 'application/zip');

      return new NextResponse(ghResponse.body as any, {
        status: 200,
        headers
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || requestUrl.origin;
    let file = '/mock-build.apk';
    const config = build.config as Record<string, any>;
    const platform = config?.platform || 'android';
    
    if (platform === 'ios') file = '/mock-build.ipa';
    else if (platform === 'macos') file = '/mock-build.dmg';
    else if (platform === 'windows') file = '/mock-build.exe';
    else if (platform === 'linux' || platform === 'pwa') file = '/mock-build.zip';
    else if (config?.storeReady) file = '/mock-build.aab';

    const redirectUrl = new URL(file, baseUrl);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
