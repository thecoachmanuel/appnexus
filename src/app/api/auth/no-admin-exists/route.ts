export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET(req: Request) {
  await connectToDatabase();
  const count = await User.countDocuments({ role: 'admin' });
  return NextResponse.json({ needsSetup: count === 0 });
}