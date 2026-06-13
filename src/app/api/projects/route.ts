import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppProject } from '@/lib/models/AppProject';
export async function GET() {
  await connectToDatabase();
  const projects = await AppProject.find({});
  return NextResponse.json(projects);
}
export async function POST(req: Request) {
  return NextResponse.json({ message: 'Created' });
}