import { NextResponse } from 'next/server';
import { getStoredRegistrations } from '@/lib/data-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  // Known demo student (matches APK School Class 10 Sec A Roll 1)
  if (!email || email === 'student.demo@campusos.edu' || email === 'student@mic-university.edu.bd' || email.includes('samiul') || email.includes('demo')) {
    return NextResponse.json({
      success: true,
      student: {
        id: 'std-sch-c10a-1',
        student_id_code: 'COS-2026-C10A-01',
        first_name: 'Tanvir',
        last_name: 'Chowdhury',
        full_name: 'Tanvir Chowdhury',
        email: 'student.demo@campusos.edu',
        phone: '+880 1712-311113',
        institution_name: 'Green Valley Smart Model School',
        class_name: 'Class 10',
        section_name: 'Section A',
        status: 'approved',
        attendance_percentage: 96.0,
        current_gpa: 5.00,
        blood_group: 'B+',
      },
    });
  }

  // Look in registrations
  const registrations = getStoredRegistrations();
  const matched = registrations.find(r => r.email.toLowerCase() === email);

  if (matched) {
    const parts = matched.full_name.trim().split(' ');
    const firstName = parts[0] || 'Admitted';
    const lastName = parts.slice(1).join(' ') || 'Student';

    return NextResponse.json({
      success: true,
      student: {
        id: matched.id,
        student_id_code: matched.student_id_code || 'COS-2026-1049',
        first_name: firstName,
        last_name: lastName,
        full_name: matched.full_name,
        email: matched.email,
        phone: matched.phone || '+880 1712-345678',
        institution_name: matched.institution_name || 'Green Valley Smart Model School',
        class_name: matched.notes?.includes('Program:') ? matched.notes.split('Program:')[1]?.split(',')[0]?.trim() : 'Class 10',
        section_name: 'Section A (Admitted Student)',
        status: matched.status,
        attendance_percentage: 98.5,
        current_gpa: 4.90,
        blood_group: 'A+',
      },
    });
  }

  // Fallback for any email
  const nameParts = email.split('@')[0].split('.');
  const fName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Admitted';
  const lName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Student';

  return NextResponse.json({
    success: true,
    student: {
      id: `st-${Date.now().toString(36)}`,
      student_id_code: `COS-2026-${Math.floor(1000 + (email.length * 137) % 8999)}`,
      first_name: fName,
      last_name: lName,
      full_name: `${fName} ${lName}`,
      email,
      phone: '+880 1712-345678',
      institution_name: 'Green Valley Smart Model School',
      class_name: 'Class 10',
      section_name: 'Admitted Student Section',
      status: 'approved',
      attendance_percentage: 95.0,
      current_gpa: 4.80,
      blood_group: 'B+',
    },
  });
}
