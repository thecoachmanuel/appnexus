import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { AppBuild } from '@/lib/models/AppBuild';
import { AppProject } from '@/lib/models/AppProject';

export async function GET() {
  try {
    await connectToDatabase();
    
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