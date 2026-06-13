import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { CreditPack } from '@/lib/models/CreditPack';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let packs = await CreditPack.find({});
    
    if (packs.length === 0) {
      await CreditPack.insertMany([
        {
          name: 'Starter Pack',
          description: 'Great for trying out the platform.',
          credits: 100,
          price: 9.99,
          is_active: true
        },
        {
          name: 'Builder Pack',
          description: 'Perfect for small teams and indie developers.',
          credits: 250,
          price: 19.99,
          is_active: true
        },
        {
          name: 'Pro Pack',
          description: 'For growing businesses shipping multiple apps.',
          credits: 500,
          price: 34.99,
          is_active: true
        },
        {
          name: 'Enterprise Pack',
          description: 'Maximum credits for power users and agencies.',
          credits: 1000,
          price: 59.99,
          is_active: true
        }
      ]);
      packs = await CreditPack.find({});
    }
    
    return NextResponse.json(packs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}