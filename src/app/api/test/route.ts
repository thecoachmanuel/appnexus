import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';

export async function GET() {
  await connectToDatabase();
  const { ApiConfiguration } = await import('@/lib/models/ApiConfiguration');
  const githubConfig = await ApiConfiguration.findOne({ provider: 'github', is_active: true });
  if (!githubConfig) return NextResponse.json({ error: 'No config' });
  
  const { github_pat, repo_owner, repo_name, workflow_id } = githubConfig.config;
  const res = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/runs?per_page=3`, {
    headers: { 'Authorization': `token ${github_pat}` }
  });
  const data = await res.json();
  if (data.workflow_runs && data.workflow_runs.length > 0) {
    const run = data.workflow_runs[0];
    const artRes = await fetch(run.artifacts_url, { headers: { 'Authorization': `token ${github_pat}` } });
    const artData = await artRes.json();
    return NextResponse.json({ runStatus: run.status, conclusion: run.conclusion, artifacts: artData });
  }
  return NextResponse.json(data);
}
