import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await connectToDatabase();
    const builds = await AppBuild.find({ user_id: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json(builds);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    await connectToDatabase();

    const build = await AppBuild.create({
      user_id: decoded.id,
      app_name: body.appName || 'My App',
      package_name: `com.app.${(body.appName || 'myapp').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      website_url: body.websiteUrl || 'https://example.com',
      config: body,
      status: 'complete',
      progress: 100,
      download_url: 'https://example.com/mock-download-url.apk'
    });

    return NextResponse.json({ buildId: build._id, message: 'Started' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}