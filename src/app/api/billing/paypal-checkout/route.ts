import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ approvalUrl: 'https://paypal.com/checkoutnow?token=mock' }); }