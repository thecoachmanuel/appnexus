import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Invoice } from '@/lib/models/Invoice';
export async function GET() {
  await connectToDatabase();
  const invoices = await Invoice.find({});
  return NextResponse.json(invoices);
}