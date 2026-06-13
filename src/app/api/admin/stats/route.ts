import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { AppBuild } from '@/lib/models/AppBuild';
import { AppProject } from '@/lib/models/AppProject';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const admin = await getUserFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fallbacks for now, but counting actual data where possible
    const totalUsers = await User.countDocuments();
    const totalBuilds = await AppBuild.countDocuments();
    const activeBuilds = await AppBuild.countDocuments({ status: { $in: ['building', 'pending'] } });

    return NextResponse.json({ 
      totalUsers,
      totalBuilds,
      activeBuilds,
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeSubscriptions: 0,
      revenue: 0,
      newUsersToday: 0,
      buildsToday: 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}