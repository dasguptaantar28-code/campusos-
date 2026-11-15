import { NextResponse } from 'next/server';
import { getStoredRegistrations } from '@/lib/data-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  // Known hardcoded demo student
  if (!email || email === 'student@mic-university.edu.bd' || email.includes('samiul')) {
    return NextResponse.json({
      success: true,
      student: {
        id: 'st-samiul-001',
        student_id_code: 'MIC-2026-0842',
        first_name: 'Samiul',
        last_name: 'Karim',
        full_name: 'Samiul Karim',
        email: 'student@mic-university.edu.bd',
        phone: '+880 1712-345678',
        institution_name: 'MIC Smart University',
        class_name: 'Computer Science & Engineering',
        section_name: 'Section A (3rd Year)',
        status: 'approved',
        attendance_percentage: 96.2,
        current_gpa: 3.88,
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
        student_id_code: matched.student_id_code || 'MIC-2026-1049',
        first_name: firstName,
        last_name: lastName,
        full_name: matched.full_name,
        email: matched.email,
        phone: matched.phone || '+880 1712-345678',
        institution_name: matched.institution_name || 'MIC Smart University',
        class_name: matched.notes?.includes('Program:') ? matched.notes.split('Program:')[1]?.split(',')[0]?.trim() : 'Computer Science & Engineering',
        section_name: 'Section A (Admitted Student)',
        status: matched.status,
        attendance_percentage: 98.5,
        current_gpa: 3.92,
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
      student_id_code: `MIC-2026-${Math.floor(1000 + (email.length * 137) % 8999)}`,
      first_name: fName,
      last_name: lName,
      full_name: `${fName} ${lName}`,
      email,
      phone: '+880 1712-345678',
      institution_name: 'MIC Smart University',
      class_name: 'Computer Science & Engineering',
      section_name: 'Admitted Student Section',
      status: 'approved',
      attendance_percentage: 95.0,
      current_gpa: 3.85,
      blood_group: 'O+',
    },
  });
}
