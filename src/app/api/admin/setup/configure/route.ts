export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { SystemSetting } from '@/lib/models/SystemSetting';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { appName, appDescription, supportEmail, defaultCredits, creditsPerBuild, seedDemoData } = body;

    const settingsToUpsert = [
      { key: 'app_name', value: appName, category: 'general', description: 'Application name' },
      { key: 'app_tagline', value: appDescription, category: 'general', description: 'Application tagline' },
      { key: 'support_email', value: supportEmail, category: 'general', description: 'Support email address' },
      { key: 'default_signup_credits', value: defaultCredits, category: 'billing', description: 'Credits for new users' },
      { key: 'credits_per_build', value: creditsPerBuild, category: 'billing', description: 'Credits consumed per build' },
    ];

    for (const setting of settingsToUpsert) {
      await SystemSetting.findOneAndUpdate(
        { key: setting.key },
        { $set: { value: JSON.stringify(setting.value), category: setting.category, description: setting.description } },
        { upsert: true, new: true }
      );
    }

    if (seedDemoData) {
      // Implement demo data seeding here
      console.log('Seeding demo data...');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Configure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
