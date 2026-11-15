import { NextResponse } from 'next/server';
import { getStoredRegistrations, addRegistration, updateRegistrationStatus } from '@/lib/data-store';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  if (!configured) return null;
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

export async function GET() {
  const localList = getStoredRegistrations();
  
  // Try querying remote Supabase registrations table if it exists
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          count: data.length,
          registrations: data,
          source: 'supabase',
        });
      }
    } catch {
      // fallback to stored list
    }
  }

  return NextResponse.json({
    success: true,
    count: localList.length,
    registrations: localList,
    source: 'synced_store',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = body.full_name || body.name || '';
    const email = (body.email || '').trim().toLowerCase();
    const phone = body.phone || '';
    const institutionName = body.institution_name || body.institution || 'Green Valley Smart Model School';
    const role = (body.role || 'student').toLowerCase() as 'student' | 'teacher' | 'parent';
    const source = body.source || 'web_portal';
    const notes = body.notes || (body.program ? `Program: ${body.program}, Guardian: ${body.guardianName || 'N/A'}` : 'Submitted via Web Portal');
    const password = body.password || '';

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const newRecord = addRegistration({
      full_name: fullName,
      email,
      phone,
      institution_name: institutionName,
      role,
      source,
      notes,
      password,
    });

    // Also attempt to push to Supabase if table exists
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('registrations').insert({
          id: newRecord.id,
          full_name: newRecord.full_name,
          email: newRecord.email,
          phone: newRecord.phone,
          institution_name: newRecord.institution_name,
          role: newRecord.role,
          source: newRecord.source,
          status: newRecord.status,
          notes: newRecord.notes,
        });
      } catch {
        // Silently preserve in local store
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted successfully and queued for Super Admin review.',
        registration: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid request payload' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid registration id and status (approved/rejected) are required.' },
        { status: 400 }
      );
    }

    const updated = updateRegistrationStatus(id, status);

    // Sync to Supabase if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('registrations')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch {
        // preserve in local store
      }
    }

    return NextResponse.json({
      success: true,
      message: `Registration marked as ${status}.`,
      registration: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}
