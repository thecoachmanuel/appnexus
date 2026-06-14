import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
import { ApiConfiguration } from '@/lib/models/ApiConfiguration';
import { getUserFromRequest } from '@/lib/auth';
// @ts-ignore
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

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
        redirect: 'follow',
        cache: 'no-store'
      });

      if (!ghResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch artifact from GitHub' }, { status: ghResponse.status });
      }

      // Read zip archive buffer
      const buffer = await ghResponse.arrayBuffer();
      
      // Extract build file inside zip
      const zip = new AdmZip(Buffer.from(buffer));
      const zipEntries = zip.getEntries();
      
      const appEntry = zipEntries.find((entry: any) => 
        !entry.isDirectory && 
        (entry.name.endsWith('.apk') || 
         entry.name.endsWith('.aab') || 
         entry.name.endsWith('.ipa') || 
         entry.name.endsWith('.zip'))
      ) || zipEntries[0];

      if (!appEntry) {
        return NextResponse.json({ error: 'No files found in artifact zip' }, { status: 400 });
      }

      const fileBuffer = appEntry.getData();
      const fileExt = appEntry.name.split('.').pop() || 'apk';
      const sanitizedName = (build.app_name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const headers = new Headers();
      headers.set('Content-Disposition', `attachment; filename="${sanitizedName}.${fileExt}"`);
      
      let contentType = 'application/octet-stream';
      if (fileExt === 'apk') contentType = 'application/vnd.android.package-archive';
      else if (fileExt === 'aab') contentType = 'application/octet-stream';
      else if (fileExt === 'ipa') contentType = 'application/octet-stream';
      else if (fileExt === 'zip') contentType = 'application/zip';
      
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', fileBuffer.length.toString());

      return new NextResponse(fileBuffer, {
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
