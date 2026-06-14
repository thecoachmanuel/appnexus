import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { SubscriptionPlan } from '@/lib/models/SubscriptionPlan';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || typeof decoded === 'string' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const decodedToken = decoded as any;
    
    // Explicitly import SubscriptionPlan to ensure it's registered in Mongoose before populate
    // We do this by passing it to populate or just ensuring it's in the file.
    const user = await User.findById(decodedToken.id).populate({
      path: 'plan_id',
      model: SubscriptionPlan
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.plan_id || user.subscription_status === 'none') {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      status: user.subscription_status,
      plan: user.plan_id,
      billing_cycle: user.billing_cycle,
      current_period_end: user.subscription_end_date,
      cancel_at_period_end: false
    });

  } catch (error: any) {
    console.error('Fetch subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
