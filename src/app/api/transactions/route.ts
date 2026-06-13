import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { PaymentTransaction } from '@/lib/models/PaymentTransaction';
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const txs = await PaymentTransaction.find({});
  return NextResponse.json(txs);
}