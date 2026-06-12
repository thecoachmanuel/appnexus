import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppProject } from '@/lib/models/AppProject';
export async function GET(req, { params }) {
  await connectToDatabase();
  const project = await AppProject.findById(params.id);
  return NextResponse.json(project);
}
export async function PUT(req) { return NextResponse.json({}); }
export async function DELETE(req) { return NextResponse.json({}); }