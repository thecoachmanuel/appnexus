import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
export async function GET() {
  await connectToDatabase();
  const builds = await AppBuild.find({});
  return NextResponse.json(builds);
}
export async function POST() { return NextResponse.json({ message: 'Started' }); }