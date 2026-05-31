import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { ObservationRecord } from '@/lib/types';

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const recordData: Partial<ObservationRecord> = await req.json();
    const db = await readDb();
    
    let updatedRecord: ObservationRecord;
    
    if (recordData.id) {
      // Update existing record
      const index = db.records.findIndex(r => r.id === recordData.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      
      updatedRecord = {
        ...db.records[index],
        ...recordData,
        // Enforce required fields
        date: recordData.date || db.records[index].date,
        dayNumber: Number(recordData.dayNumber) ?? db.records[index].dayNumber,
        length: Number(recordData.length) ?? db.records[index].length,
        color: recordData.color ?? db.records[index].color,
        foodConsumption: recordData.foodConsumption ?? db.records[index].foodConsumption,
        feedingDate: recordData.feedingDate ?? db.records[index].feedingDate,
        appearanceDescription: recordData.appearanceDescription ?? db.records[index].appearanceDescription,
        problemFound: recordData.problemFound ?? db.records[index].problemFound,
        solution: recordData.solution ?? db.records[index].solution,
        mediaType: recordData.mediaType ?? db.records[index].mediaType,
        mediaUrl: recordData.mediaUrl ?? db.records[index].mediaUrl,
      };
      
      db.records[index] = updatedRecord;
    } else {
      // Create new record
      const newId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      updatedRecord = {
        id: newId,
        date: recordData.date || new Date().toISOString().split('T')[0],
        dayNumber: Number(recordData.dayNumber) || 1,
        length: Number(recordData.length) || 0,
        color: recordData.color || '',
        foodConsumption: recordData.foodConsumption || '無',
        feedingDate: recordData.feedingDate || '',
        appearanceDescription: recordData.appearanceDescription || '',
        problemFound: recordData.problemFound || '',
        solution: recordData.solution || '',
        mediaType: recordData.mediaType || 'none',
        mediaUrl: recordData.mediaUrl || '',
      };
      
      db.records.push(updatedRecord);
    }
    
    // Sort records by day number or date to keep timeline neat
    db.records.sort((a, b) => a.dayNumber - b.dayNumber);
    
    await writeDb(db);
    return NextResponse.json({ success: true, record: updatedRecord, records: db.records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing record id' }, { status: 400 });
    }
    
    const db = await readDb();
    const index = db.records.findIndex(r => r.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    db.records.splice(index, 1);
    await writeDb(db);
    
    return NextResponse.json({ success: true, records: db.records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete record' }, { status: 500 });
  }
}
