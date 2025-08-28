import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { EventService } from '@/lib/services/eventService';
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
        ei.*,
        COUNT(DISTINCT inv.id) FILTER (WHERE inv.main_invitee = false) as invitee_count,
        ROUND(
          (COUNT(DISTINCT inv.id) FILTER (WHERE inv.invitees_attendance = true AND inv.main_invitee = false) * 100.0) / 
          NULLIF(COUNT(DISTINCT inv.id) FILTER (WHERE inv.main_invitee = false), 0), 
          0
        ) as attendance_rate
      FROM bydaya_event_items ei
      LEFT JOIN bydaya_event_invitees inv ON ei.id = inv.student_item_id AND inv.active = true
      WHERE ei.event_id = $1 AND ei.active = true
      GROUP BY ei.id
      ORDER BY ei.created_at DESC
    `, [eventId]);

    return NextResponse.json({
      students: result.rows,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    const body = await request.json();
    
    const {
      student_id,
      student_name,
      student_email,
      student_email_parent_1,
      student_email_parent_2,
      number_of_seats,
      invitees
    } = body;

    // Validate required fields
    if (!student_id || !student_name || !student_email || !student_email_parent_1) {
      return NextResponse.json(
        { error: "Required fields: student_id, student_name, student_email, student_email_parent_1" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Set default number_of_seats to 1
    const defaultNumberOfSeats = number_of_seats || 1;

    // Check if event exists
    const eventCheck = await query('SELECT id FROM bydaya_events WHERE id = $1 AND active = true', [eventId]);
    if (eventCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Check if student ID already exists in this event
    const existingStudent = await query(
      'SELECT id FROM bydaya_event_items WHERE event_id = $1 AND student_id = $2 AND active = true',
      [eventId, student_id]
    );
    
    if (existingStudent.rows.length > 0) {
      return NextResponse.json(
        { error: "Student ID already exists in this event" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const student = await EventService.createEventItem({
      event_id: eventId,
      student_id,
      student_name,
      student_email,
      student_email_parent_1,
      student_email_parent_2,
      number_of_seats: defaultNumberOfSeats,
      invitees
    });

    return NextResponse.json({
      student,
      success: true
    }, {
      status: 201,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}