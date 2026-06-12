import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ hostedUrl: 'https://commerce.coinbase.com/checkout/mock' }); }