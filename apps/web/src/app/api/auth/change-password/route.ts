import { NextResponse } from 'next/server';

let currentSuperAdminPassword = 'password123';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'verify';

    if (action === 'verify') {
      const password = (body.password || '').trim();
      const valid = password === currentSuperAdminPassword;
      return NextResponse.json({ valid });
    }

    if (action === 'change') {
      const currentPassword = (body.currentPassword || '').trim();
      const newPassword = (body.newPassword || '').trim();

      if (currentPassword !== currentSuperAdminPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password does not match.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      currentSuperAdminPassword = newPassword;
      return NextResponse.json({
        success: true,
        message: 'Super Admin password updated successfully.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}
