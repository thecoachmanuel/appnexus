import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET(req) {
  await connectToDatabase();
  // Need jwt parsing, returning mock for now
  return NextResponse.json({ message: 'Auth GET' });
}

export async function PUT(req) {
  return NextResponse.json({ message: 'Auth PUT' });
}