import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
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

    const buildId = new mongoose.Types.ObjectId();
    const requestUrl = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || requestUrl.origin;

    const build = await AppBuild.create({
      _id: buildId,
      user_id: decoded.id,
      app_name: body.appName || 'AppNexus',
      package_name: `com.app.${(body.appName || 'appnexus').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      website_url: body.websiteUrl || baseUrl,
      config: body,
      status: 'complete',
      progress: 100,
      download_url: `${baseUrl}/api/builds/${buildId}/download`
    });

    return NextResponse.json({ buildId: build._id, message: 'Started' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}