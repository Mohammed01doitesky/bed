import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';
import { withRoleAuth } from '@/lib/middleware/roleAuth';
import { User } from '@/types';

async function handleDashboard(request: NextRequest, context: any, user: User): Promise<NextResponse> {
  try {
    // Get total events count
    const eventsResult = await query('SELECT COUNT(*) as count FROM bydaya_events WHERE active = true');
    const totalEvents = parseInt(eventsResult.rows[0].count);

    // Get total invitees count
    const inviteesResult = await query('SELECT COUNT(*) as count FROM bydaya_event_invitees WHERE active = true');
    const totalInvitees = parseInt(inviteesResult.rows[0].count);

    // Get attendance rate
    const attendanceResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE invitees_attendance = true) as attended,
        COUNT(*) as total
      FROM bydaya_event_invitees
      WHERE active = true
    `);
    const attendanceData = attendanceResult.rows[0];
    const attendanceRate = attendanceData.total > 0
      ? Math.round((attendanceData.attended / attendanceData.total) * 100)
      : 0;

    // Get recent events
    const recentEventsResult = await query(`
      SELECT id, name, location, created_at
      FROM bydaya_events
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const dashboardData = {
      totalEvents,
      totalInvitees,
      attendanceRate,
      recentEvents: recentEventsResult.rows,
      user: {
        username: user.username,
        role: user.role
      }
    };

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

// Export with role-based authentication - requires web access
export const GET = withRoleAuth(handleDashboard, 'web');