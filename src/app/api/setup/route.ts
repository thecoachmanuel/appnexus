import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    
    const email = 'admin@appnexus.com';
    const password = 'admin123';

    let user = await User.findOne({ email });

    if (user) {
      // Ensure role is admin
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
      return NextResponse.json({ message: 'Admin user already exists and role ensured' }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      email,
      password: hashedPassword,
      display_name: 'Super Admin',
      role: 'admin',
      credits: 1000 // Give admin some credits to start with
    });

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      email: user.email 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
