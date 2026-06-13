import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { CreditPack } from '@/lib/models/CreditPack';
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const packs = await CreditPack.find({});
  return NextResponse.json(packs);
}