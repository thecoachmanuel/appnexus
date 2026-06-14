import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { CreditPack } from '@/lib/models/CreditPack';
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

    const { priceId, returnUrl } = await req.json();

    const creditPack = await CreditPack.findById(priceId);
    if (!creditPack) {
      return NextResponse.json({ error: 'Credit pack not found' }, { status: 404 });
    }

    const creditsToAdd = creditPack.credits;

    // Record the transaction
    await PaymentTransaction.create({
      user_id: decodedToken.id,
      amount: creditPack.price,
      currency: 'USD',
      payment_method: 'stripe_mock',
      transaction_type: 'credit_purchase',
      status: 'completed',
      reference_id: `mock_txn_${Date.now()}`
    });

    // Immediately grant the credits (Mocking the webhook for instant local test)
    await User.findByIdAndUpdate(decodedToken.id, {
      $inc: { credits: creditsToAdd }
    });

    // Return the success URL (in a real Stripe integration, this would return the Stripe Checkout URL)
    const successUrl = new URL(returnUrl);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('mock_credits', creditsToAdd.toString());

    return NextResponse.json({ url: successUrl.toString() });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
