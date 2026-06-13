import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { userId: string } }) {
  try {
    await connectToDatabase();
    
    // Authenticate Admin
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(params.userId, { role }, { new: true });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
