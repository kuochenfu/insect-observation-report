import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { ReportMetadata } from '@/lib/types';

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.metadata);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch report metadata' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const updatedMetadata: ReportMetadata = await req.json();
    const db = await readDb();
    db.metadata = {
      ...db.metadata,
      ...updatedMetadata
    };
    await writeDb(db);
    return NextResponse.json({ success: true, metadata: db.metadata });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update report metadata' }, { status: 500 });
  }
}
