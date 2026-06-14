import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppProject } from '@/lib/models/AppProject';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const project = await AppProject.findById(params.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (project.user_id.toString() !== user._id.toString() && user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { build_id, ...projectData } = body;

    await connectToDatabase();
    const project = await AppProject.findById(params.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (project.user_id.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update project fields
    Object.assign(project, projectData);
    await project.save();

    if (build_id) {
      const { AppBuild } = await import('@/lib/models/AppBuild');
      await AppBuild.findByIdAndUpdate(build_id, {
        project_id: project._id
      });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Project update error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const project = await AppProject.findById(params.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (project.user_id.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await AppProject.findByIdAndDelete(params.id);
    
    // Also delete associated builds
    const { AppBuild } = await import('@/lib/models/AppBuild');
    await AppBuild.deleteMany({ project_id: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Project delete error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}