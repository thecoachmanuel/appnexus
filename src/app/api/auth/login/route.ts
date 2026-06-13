import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const adminEmailEnv = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPasswordEnv = process.env.ADMIN_PASSWORD;

    let user = await User.findOne({ email: email.toLowerCase() });

    // Handle Environment Variable Admin Login
    if (adminEmailEnv && adminPasswordEnv && email.toLowerCase() === adminEmailEnv && password === adminPasswordEnv) {
      if (!user) {
        // Auto-create admin if it doesn't exist but env vars match
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
          email: adminEmailEnv,
          password: hashedPassword,
          display_name: 'Super Admin',
          role: 'admin',
          credits: 1000
        });
      } else if (user.role !== 'admin') {
        // Force upgrade to admin if they were a regular user
        user.role = 'admin';
        await user.save();
      }
      // Skip standard password check since they matched the ENV password
    } else {
      // Standard Login Flow
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    const token = signToken({ id: user._id, role: user.role });

    return NextResponse.json({
      id: user._id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      token
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}