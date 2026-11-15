import { NextRequest, NextResponse } from 'next/server';
import { getExamsStore } from '@/lib/school-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get('className') || 'Class 10';
    const institutionId = searchParams.get('institutionId') || 'inst-school';
    const key = `${institutionId} - ${className}`;

    const store = getExamsStore();
    const exams = store[key] || store[className] || [];

    return NextResponse.json({
      success: true,
      className,
      exams
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
