import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import { SystemSetting } from '@/lib/models/SystemSetting';
import { SubscriptionPlan } from '@/lib/models/SubscriptionPlan';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = {
    db: false,
    auth: true, // Auth relies on DB, so if DB is up, auth is up
    settings: false,
    plans: false
  };

  try {
    await connectToDatabase();
    status.db = mongoose.connection.readyState === 1;

    if (status.db) {
      const settingsCount = await SystemSetting.countDocuments();
      status.settings = settingsCount >= 0;

      const plansCount = await SubscriptionPlan.countDocuments({ is_active: true });
      status.plans = plansCount >= 0;
    }
  } catch (err) {
    console.error("Health check error:", err);
  }

  return NextResponse.json(status);
}
