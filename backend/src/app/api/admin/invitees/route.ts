import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student');
    const emailSent = searchParams.get('emailSent'); // 'true', 'false', or null
    const eventId = searchParams.get('eventId');
    
    let queryText = `
      SELECT 
        inv.*,
        e.name as event_name,
        e.id as event_id,
        ei.student_name,
        ei.student_email,
        ei.id as student_item_id
      FROM bydaya_event_invitees inv
      JOIN bydaya_event_items ei ON inv.student_item_id = ei.id
      JOIN bydaya_events e ON inv.event_id = e.id
      WHERE inv.active = true AND ei.active = true AND e.active = true
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (studentId) {
      paramCount++;
      queryText += ` AND ei.id = $${paramCount}`;
      params.push(parseInt(studentId));
    }
    
    if (eventId) {
      paramCount++;
      queryText += ` AND e.id = $${paramCount}`;
      params.push(parseInt(eventId));
    }
    
    if (emailSent === 'true') {
      queryText += ` AND inv.mail_send = true`;
    } else if (emailSent === 'false') {
      queryText += ` AND inv.mail_send = false`;
    }
    
    queryText += ` ORDER BY inv.created_at DESC`;

    const result = await query(queryText, params);

    // Get summary statistics for the filtered results
    let summaryQuery = `
      SELECT 
        COUNT(*) as total_invitees,
        SUM(CASE WHEN inv.mail_send = true THEN 1 ELSE 0 END) as emails_sent,
        SUM(CASE WHEN inv.mail_send = false THEN 1 ELSE 0 END) as emails_pending,
        COUNT(CASE WHEN inv.main_invitee = true THEN 1 END) as main_invitees
      FROM bydaya_event_invitees inv
      JOIN bydaya_event_items ei ON inv.student_item_id = ei.id
      JOIN bydaya_events e ON inv.event_id = e.id
      WHERE inv.active = true AND ei.active = true AND e.active = true
    `;
    
    const summaryParams: any[] = [];
    let summaryParamCount = 0;
    
    if (studentId) {
      summaryParamCount++;
      summaryQuery += ` AND ei.id = $${summaryParamCount}`;
      summaryParams.push(parseInt(studentId));
    }
    
    if (eventId) {
      summaryParamCount++;
      summaryQuery += ` AND e.id = $${summaryParamCount}`;
      summaryParams.push(parseInt(eventId));
    }
    
    if (emailSent === 'true') {
      summaryQuery += ` AND inv.mail_send = true`;
    } else if (emailSent === 'false') {
      summaryQuery += ` AND inv.mail_send = false`;
    }
    
    const summaryResult = await query(summaryQuery, summaryParams);
    const summary = summaryResult.rows[0];

    return NextResponse.json({
      invitees: result.rows,
      summary: {
        total_invitees: parseInt(summary.total_invitees) || 0,
        emails_sent: parseInt(summary.emails_sent) || 0,
        emails_pending: parseInt(summary.emails_pending) || 0,
        main_invitees: parseInt(summary.main_invitees) || 0
      },
      filters: {
        studentId,
        eventId,
        emailSent
      },
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get invitees error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}