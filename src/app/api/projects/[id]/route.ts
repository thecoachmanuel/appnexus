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

  if (project.user_id !== user._id.toString() && user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(project);
}
export async function PUT(req: Request) { return NextResponse.json({}); }
export async function DELETE(req: Request) { return NextResponse.json({}); }