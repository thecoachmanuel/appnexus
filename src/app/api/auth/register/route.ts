import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { email, password, display_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      display_name: display_name || '',
      role: 'user'
    });

    const token = signToken({ id: user._id, role: user.role });

    return NextResponse.json({
      id: user._id,
      email: user.email,
      display_name: user.display_name,
      token
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}