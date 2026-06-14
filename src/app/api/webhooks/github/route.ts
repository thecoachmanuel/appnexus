import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
import { AppProject } from '@/lib/models/AppProject';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { build_id, status, artifact_id, error_message } = body;

    if (!build_id) {
      return NextResponse.json({ error: 'Missing build_id' }, { status: 400 });
    }

    await connectToDatabase();
    
    const build = await AppBuild.findById(build_id);
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    build.status = status || 'complete';
    
    if (status === 'complete') {
      build.progress = 100;
    } else if (status === 'failed') {
      build.progress = 100;
      build.error_message = error_message || 'Build failed.';
    }

    if (artifact_id) {
      const requestUrl = new URL(req.url);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || requestUrl.origin;
      build.download_url = `${baseUrl}/api/builds/${build._id}/download?artifact_id=${artifact_id}`;
    }

    await build.save();

    // If there is an associated project, update its build status as well
    if (build.project_id) {
      await AppProject.findByIdAndUpdate(build.project_id, {
        build_status: build.status
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("GitHub Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
