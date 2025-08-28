import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        e.*,
        COUNT(DISTINCT ei.id) FILTER (WHERE ei.main_invitee = false) as invitee_count,
        ROUND(
          (COUNT(DISTINCT ei.id) FILTER (WHERE ei.invitees_attendance = true AND ei.main_invitee = false) * 100.0) / 
          NULLIF(COUNT(DISTINCT ei.id) FILTER (WHERE ei.main_invitee = false), 0), 
          0
        ) as attendance_rate
      FROM bydaya_events e
      LEFT JOIN bydaya_event_invitees ei ON e.id = ei.event_id AND ei.active = true
      WHERE e.active = true
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    return NextResponse.json({
      events: result.rows,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, email_subject } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const event = await EventService.createEvent({
      name,
      location: location || '',
      email_subject: email_subject || 'BIS Tickets'
    });

    return NextResponse.json({
      event,
      success: true
    }, {
      status: 201,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}