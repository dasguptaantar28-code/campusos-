import { NextRequest, NextResponse } from 'next/server';
import { getRoutinesStore } from '@/lib/school-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get('className') || 'Class 10';
    const sectionName = searchParams.get('sectionName') || 'Section A';
    const institutionId = searchParams.get('institutionId') || 'inst-school';
    const key = `${institutionId} - ${className} - ${sectionName}`;
    const legacyKey = `${className} - ${sectionName}`;

    const store = getRoutinesStore();
    const slots = store[key] || store[legacyKey] || Object.values(store)[0] || [];

    return NextResponse.json({
      success: true,
      className,
      sectionName,
      slots
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
