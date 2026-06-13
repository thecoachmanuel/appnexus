import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { SubscriptionPlan } from '@/lib/models/SubscriptionPlan';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let plans = await SubscriptionPlan.find({});
    
    if (plans.length === 0) {
      await SubscriptionPlan.insertMany([
        {
          name: 'Free',
          tier: 'free',
          price_monthly: 0,
          price_yearly: 0,
          monthly_credits: 5,
          description: 'Basic access with limited credits.',
          is_active: true,
          features: {
            app_builds: 1,
            push_notifications: false
          }
        },
        {
          name: 'Pro',
          tier: 'pro',
          price_monthly: 19.99,
          price_yearly: 199.99,
          monthly_credits: 50,
          description: 'Perfect for small teams and power users.',
          is_active: true,
          features: {
            app_builds: 10,
            push_notifications: true,
            priority_support: true
          }
        },
        {
          name: 'Enterprise',
          tier: 'enterprise',
          price_monthly: 99.99,
          price_yearly: 999.99,
          monthly_credits: 500,
          description: 'For growing businesses and agencies.',
          is_active: true,
          features: {
            app_builds: -1,
            push_notifications: true,
            priority_support: true,
            white_label: true
          }
        }
      ]);
      plans = await SubscriptionPlan.find({});
    }
    
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}