import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const build = await AppBuild.findById(params.id);
    
    if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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