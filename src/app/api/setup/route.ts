import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { CreditPack } from '@/lib/models/CreditPack';

export async function GET() {
  try {
    await connectToDatabase();
    
    // --- Seed Admin User ---
    const email = 'admin@appnexus.com';
    const password = 'admin123';

    let user = await User.findOne({ email });

    if (user) {
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword,
        display_name: 'Super Admin',
        role: 'admin',
        credits: 1000
      });
    }

    // --- Seed Credit Packs ---
    const existingPacks = await CreditPack.countDocuments();
    if (existingPacks === 0) {
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
    }

    return NextResponse.json({ 
      message: 'Setup complete. Admin user and credit packs are ready.',
      admin: email,
      credit_packs_seeded: existingPacks === 0 ? 4 : 0
    }, { status: 200 });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}
