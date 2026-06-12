import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
export async function GET() {
  await connectToDatabase();
  const users = await User.countDocuments();
  return NextResponse.json({ totalUsers: users });
}