import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    
    const result = await query(`
      SELECT 
        e.*,
        COUNT(DISTINCT ei.id) FILTER (WHERE ei.main_invitee = false) as invitee_count,
        COUNT(DISTINCT eitem.id) as student_count,
        ROUND(
          (COUNT(DISTINCT ei.id) FILTER (WHERE ei.invitees_attendance = true AND ei.main_invitee = false) * 100.0) / 
          NULLIF(COUNT(DISTINCT ei.id) FILTER (WHERE ei.main_invitee = false), 0), 
          0
        ) as attendance_rate
      FROM bydaya_events e
      LEFT JOIN bydaya_event_invitees ei ON e.id = ei.event_id AND ei.active = true
      LEFT JOIN bydaya_event_items eitem ON e.id = eitem.event_id AND eitem.active = true
      WHERE e.id = $1 AND e.active = true
      GROUP BY e.id
    `, [eventId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      event: result.rows[0],
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    const body = await request.json();
    const { name, location, email_subject } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await query(`
      UPDATE bydaya_events 
      SET name = $1, location = $2, email_subject = $3, updated_at = NOW()
      WHERE id = $4 AND active = true
      RETURNING *
    `, [name, location || '', email_subject || 'BIS Tickets', eventId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      event: result.rows[0],
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);

    // Soft delete - set active to false
    const result = await query(`
      UPDATE bydaya_events 
      SET active = false, updated_at = NOW()
      WHERE id = $1 AND active = true
      RETURNING id
    `, [eventId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Also soft delete related records
    await query(`
      UPDATE bydaya_event_items 
      SET active = false, updated_at = NOW()
      WHERE event_id = $1
    `, [eventId]);

    await query(`
      UPDATE bydaya_event_invitees 
      SET active = false, updated_at = NOW()
      WHERE event_id = $1
    `, [eventId]);

    return NextResponse.json({
      message: "Event deleted successfully",
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}