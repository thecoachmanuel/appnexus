import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { SystemSetting } from '@/lib/models/SystemSetting';
export async function GET() {
  await connectToDatabase();
  const settings = await SystemSetting.find({});
  return NextResponse.json(settings);
}
export async function POST(req) { return NextResponse.json({}); }