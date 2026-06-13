import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { SubscriptionPlan } from '@/lib/models/SubscriptionPlan';
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const plans = await SubscriptionPlan.find({});
  return NextResponse.json(plans);
}