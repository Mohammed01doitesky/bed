import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';
import { EmailService } from '@/lib/services/emailService';

export async function GET(request: NextRequest) {
  try {
    // Get total events
    const eventsResult = await query(`
      SELECT COUNT(*) as total_events
      FROM bydaya_events 
      WHERE active = true
    `);

    // Get total invitees
    const inviteesResult = await query(`
      SELECT COUNT(*) as total_invitees
      FROM bydaya_event_invitees inv
      JOIN bydaya_events e ON inv.event_id = e.id
      WHERE inv.active = true AND e.active = true
    `);

    // Get average attendance rate
    const attendanceResult = await query(`
      SELECT 
        COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) as attended,
        COUNT(*) as total
      FROM bydaya_event_invitees inv
      JOIN bydaya_events e ON inv.event_id = e.id
      WHERE inv.active = true AND e.active = true
    `);

    // Get monthly statistics
    const monthlyResult = await query(`
      SELECT 
        TO_CHAR(e.created_at, 'Month YYYY') as month,
        COUNT(DISTINCT e.id) as events,
        COALESCE(ROUND(
          (COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) * 100.0) / 
          NULLIF(COUNT(inv.id), 0), 
          0
        ), 0) as attendance
      FROM bydaya_events e
      LEFT JOIN bydaya_event_invitees inv ON e.id = inv.event_id AND inv.active = true
      WHERE e.active = true 
        AND e.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(e.created_at, 'Month YYYY'), DATE_TRUNC('month', e.created_at)
      ORDER BY DATE_TRUNC('month', e.created_at) DESC
      LIMIT 12
    `);

    const totalEvents = parseInt(eventsResult.rows[0]?.total_events || '0');
    const totalInvitees = parseInt(inviteesResult.rows[0]?.total_invitees || '0');
    
    const attendanceData = attendanceResult.rows[0];
    const averageAttendance = attendanceData && attendanceData.total > 0 
      ? Math.round((attendanceData.attended / attendanceData.total) * 100)
      : 0;

    const monthlyStats = monthlyResult.rows.map(row => ({
      month: row.month.trim(),
      events: parseInt(row.events),
      attendance: parseInt(row.attendance)
    }));

    // Get email statistics
    const emailStats = await EmailService.getEmailStatistics();

    return NextResponse.json({
      totalEvents,
      totalInvitees,
      averageAttendance,
      monthlyStats,
      emailStatistics: emailStats
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}