import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { EmailTemplate } from '@/lib/models/EmailTemplate';
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const templates = await EmailTemplate.find({});
  return NextResponse.json(templates);
}