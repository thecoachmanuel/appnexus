import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { CreditPack } from '@/lib/models/CreditPack';
import { SubscriptionPlan } from '@/lib/models/SubscriptionPlan';
import { PaymentTransaction } from '@/lib/models/PaymentTransaction';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
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
    const body = await req.json();
    
    // Support legacy requests that just sent priceId, default to credits
    const type = body.type || 'credits';
    const { returnUrl } = body;

    let priceAmount = 0;
    let creditsToAdd = 0;

    if (type === 'subscription') {
      const { planId, billingCycle } = body;
      const plan = await SubscriptionPlan.findById(planId);
      
      if (!plan) {
        return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
      }

      priceAmount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
      creditsToAdd = plan.monthly_credits;

      await PaymentTransaction.create({
        user_id: decodedToken.id,
        amount: priceAmount,
        currency: 'USD',
        payment_method: 'stripe_mock',
        transaction_type: 'subscription',
        status: 'completed',
        reference_id: `mock_sub_${Date.now()}`
      });

      // Update user with subscription details and grant initial credits
      const endDate = new Date();
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await User.findByIdAndUpdate(decodedToken.id, {
        plan_id: plan._id,
        billing_cycle: billingCycle,
        subscription_status: 'active',
        subscription_end_date: endDate,
        $inc: { credits: creditsToAdd }
      });

    } else {
      // Credits checkout
      const priceId = body.creditPackId || body.priceId;
      const creditPack = await CreditPack.findById(priceId);
      
      if (!creditPack) {
        return NextResponse.json({ error: 'Credit pack not found' }, { status: 404 });
      }

      priceAmount = creditPack.price;
      creditsToAdd = creditPack.credits;

      await PaymentTransaction.create({
        user_id: decodedToken.id,
        amount: priceAmount,
        currency: 'USD',
        payment_method: 'stripe_mock',
        transaction_type: 'credit_purchase',
        status: 'completed',
        reference_id: `mock_txn_${Date.now()}`
      });

      // Grant credits
      await User.findByIdAndUpdate(decodedToken.id, {
        $inc: { credits: creditsToAdd }
      });
    }

    const successUrl = new URL(returnUrl);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('mock_credits', creditsToAdd.toString());

    return NextResponse.json({ url: successUrl.toString() });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
