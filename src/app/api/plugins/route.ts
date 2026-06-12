import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Plugin } from '@/lib/models/Plugin';
export async function GET() {
  await connectToDatabase();
  const plugins = await Plugin.find({});
  return NextResponse.json(plugins);
}