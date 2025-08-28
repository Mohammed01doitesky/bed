import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inviteeId = parseInt(id);
    const body = await request.json();
    const { attendance } = body;

    if (typeof attendance !== 'boolean') {
      return NextResponse.json(
        { error: "Attendance must be a boolean value" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Update attendance
    const result = await query(`
      UPDATE bydaya_event_invitees 
      SET 
        invitees_attendance = $1,
        invitees_attendance_time = $2,
        updated_at = NOW()
      WHERE id = $3 AND active = true
      RETURNING id
    `, [attendance, attendance ? new Date().toISOString() : null, inviteeId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invitee not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance ${attendance ? 'marked' : 'unmarked'} successfully`
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}