import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const build = await AppBuild.findById(params.id);
    if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const requestUrl = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || requestUrl.origin;
    
    // Determine which file to serve based on the platform in the configuration
    let file = '/mock-build.apk';
    const config = build.config as Record<string, any>;
    const platform = config?.platform || 'android';
    
    if (platform === 'ios') file = '/mock-build.ipa';
    else if (platform === 'macos') file = '/mock-build.dmg';
    else if (platform === 'windows') file = '/mock-build.exe';
    else if (platform === 'linux' || platform === 'pwa') file = '/mock-build.zip';
    else if (config?.storeReady) file = '/mock-build.aab';

    return NextResponse.redirect(`${baseUrl}${file}`);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
