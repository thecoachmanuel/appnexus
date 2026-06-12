import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AppBuild } from '@/lib/models/AppBuild';
export async function GET(req, { params }) {
  await connectToDatabase();
  const build = await AppBuild.findById(params.id);
  return NextResponse.json({ status: build?.status || 'unknown' });
}