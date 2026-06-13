import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Invoice } from '@/lib/models/Invoice';
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const invoices = await Invoice.find({});
  return NextResponse.json(invoices);
}