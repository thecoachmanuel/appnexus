import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Invoice } from '@/lib/models/Invoice';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // If admin, return all invoices. Otherwise, only return the user's invoices.
    const query = user.role === 'admin' ? {} : { user_id: user._id };
    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}