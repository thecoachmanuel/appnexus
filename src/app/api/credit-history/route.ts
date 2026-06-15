import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { CreditUsage } from '@/lib/models/CreditUsage';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    await connectToDatabase();
    const history = await CreditUsage.find({ user_id: decoded.id })
                                     .sort({ createdAt: -1 })
                                     .limit(limit);
                                     
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Credit History API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
