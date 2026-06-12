import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { PaymentTransaction } from '@/lib/models/PaymentTransaction';
export async function GET() {
  await connectToDatabase();
  const txs = await PaymentTransaction.find({});
  return NextResponse.json(txs);
}