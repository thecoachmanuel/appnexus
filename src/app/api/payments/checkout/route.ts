import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
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
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { priceId, returnUrl } = await req.json();

    // Map the priceId/packId to credits
    // According to mock data in useCreditPacks: 
    // pack_1 -> 100, pack_2 -> 250, pack_3 -> 500, pack_4 -> 1000
    let creditsToAdd = 0;
    if (priceId === 'pack_1') creditsToAdd = 100;
    else if (priceId === 'pack_2') creditsToAdd = 250;
    else if (priceId === 'pack_3') creditsToAdd = 500;
    else if (priceId === 'pack_4') creditsToAdd = 1000;
    else creditsToAdd = 100; // fallback

    // Immediately grant the credits (Mocking the webhook for instant local test)
    await User.findByIdAndUpdate(decoded.id, {
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
