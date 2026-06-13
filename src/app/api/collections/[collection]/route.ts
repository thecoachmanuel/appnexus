import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { ApiConfiguration } from '@/lib/models/ApiConfiguration';
import { getUserFromRequest } from '@/lib/auth';

import { PaymentTransaction } from '@/lib/models/PaymentTransaction';

const getModel = (collectionName: string) => {
  if (collectionName === 'api_configurations') return ApiConfiguration;
  if (collectionName === 'payment_transactions') return PaymentTransaction;
  // Mock models for UI compatibility
  if (collectionName === 'user_roles' || collectionName === 'webhook_event_logs') {
    return {
      find: async () => [],
      create: async () => ({}),
      findOneAndUpdate: async () => ({}),
      deleteMany: async () => ({ success: true })
    } as any;
  }
  return null;
};

export async function GET(req: Request, { params }: { params: { collection: string } }) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Model = getModel(params.collection);
    if (!Model) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });

    const url = new URL(req.url);
    const query: any = {};
    
    // Convert supbase-like URL params to Mongo query
    const providerIn = url.searchParams.get('provider_in');
    if (providerIn) {
      query.provider = { $in: providerIn.split(',') };
    }

    const id = url.searchParams.get('id');
    if (id) {
      query._id = id;
    }

    const data = await Model.find(query);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { collection: string } }) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Model = getModel(params.collection);
    if (!Model) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });

    const body = await req.json();
    const payload = body.payload || body;

    const created = await Model.create(payload);
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { collection: string } }) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Model = getModel(params.collection);
    if (!Model) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });

    const body = await req.json();
    const payload = body.payload;
    const urlQuery = body.query || {};

    const dbQuery: any = {};
    if (urlQuery.id) dbQuery._id = urlQuery.id;

    if (Object.keys(dbQuery).length === 0) {
      return NextResponse.json({ error: 'Missing update condition (id)' }, { status: 400 });
    }

    const updated = await Model.findOneAndUpdate(dbQuery, { $set: payload }, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { collection: string } }) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Model = getModel(params.collection);
    if (!Model) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const idIn = url.searchParams.get('id_in');

    const query: any = {};
    if (id) query._id = id;
    if (idIn) query._id = { $in: idIn.split(',') };

    await Model.deleteMany(query);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
