import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { SystemSetting } from '@/lib/models/SystemSetting';
export async function GET() {
  await connectToDatabase();
  const settings = await SystemSetting.find({});
  return NextResponse.json(settings);
}
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { key, value, category } = body;
    
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    const updated = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { value, category: category || 'general' } },
      { new: true, upsert: true }
    );
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { key, value } = body;
    
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    const updated = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}