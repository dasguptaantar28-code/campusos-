import { NextRequest, NextResponse } from 'next/server';
import {
  getSchoolStudents,
  updateSchoolStudent,
  getStudentByEmail,
  getChildrenForGuardian
} from '@/lib/school-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get('className');
    const sectionName = searchParams.get('sectionName');
    const institutionId = searchParams.get('institutionId');
    const email = searchParams.get('email');
    const guardianEmail = searchParams.get('guardianEmail');
    const search = searchParams.get('search');

    if (email) {
      const student = getStudentByEmail(email);
      if (!student) {
        return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, student });
    }

    if (guardianEmail) {
      const children = getChildrenForGuardian(guardianEmail);
      return NextResponse.json({ success: true, children });
    }

    let list = getSchoolStudents();

    if (institutionId && institutionId !== 'all') {
      list = list.filter(s => s.institutionId === institutionId);
    }

    if (className && className !== 'all') {
      list = list.filter(s => s.className.toLowerCase() === className.toLowerCase());
    }

    if (sectionName && sectionName !== 'all') {
      list = list.filter(s => s.sectionName.toLowerCase() === sectionName.toLowerCase());
    }

    if (search) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentIdCode.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q) ||
        s.rollDisplay.includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      students: list
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Missing student id' }, { status: 400 });
    }

    const updated = updateSchoolStudent(body);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Student record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated student ${updated.fullName} (${updated.studentIdCode})`,
      student: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
