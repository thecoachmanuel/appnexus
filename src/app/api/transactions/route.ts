import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { PaymentTransaction } from '@/lib/models/PaymentTransaction';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // If admin, return all transactions. Otherwise, only return the user's transactions.
    const query = user.role === 'admin' ? {} : { user_id: user._id };
    const txs = await PaymentTransaction.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(txs);
  } catch (error: any) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}