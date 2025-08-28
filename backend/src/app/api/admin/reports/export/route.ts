import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const eventId = searchParams.get('eventId');

    let workbook: XLSX.WorkBook;
    let filename: string;

    switch (reportType) {
      case 'attendance':
        const result = await generateAttendanceReport(eventId);
        workbook = result.workbook;
        filename = result.filename;
        break;
      case 'events':
        workbook = await generateEventsReport();
        filename = 'events_report.xlsx';
        break;
      case 'monthly':
        workbook = await generateMonthlyReport();
        filename = 'monthly_report.xlsx';
        break;
      default:
        workbook = await generateSummaryReport();
        filename = 'summary_report.xlsx';
    }

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

async function generateSummaryReport(): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new();

  // Summary statistics
  const summaryResult = await query(`
    SELECT 
      'Total Events' as metric,
      COUNT(DISTINCT e.id) as value
    FROM bydaya_events e
    WHERE e.active = true
    
    UNION ALL
    
    SELECT 
      'Total Invitees' as metric,
      COUNT(DISTINCT inv.id) as value
    FROM bydaya_event_invitees inv
    JOIN bydaya_events e ON inv.event_id = e.id
    WHERE inv.active = true AND e.active = true
    
    UNION ALL
    
    SELECT 
      'Total Attended' as metric,
      COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) as value
    FROM bydaya_event_invitees inv
    JOIN bydaya_events e ON inv.event_id = e.id
    WHERE inv.active = true AND e.active = true
    
    UNION ALL
    
    SELECT 
      'Attendance Rate (%)' as metric,
      COALESCE(ROUND(
        (COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 
        0
      ), 0) as value
    FROM bydaya_event_invitees inv
    JOIN bydaya_events e ON inv.event_id = e.id
    WHERE inv.active = true AND e.active = true
  `);

  const summaryData = summaryResult.rows.map(row => ({
    Metric: row.metric,
    Value: row.value
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  return workbook;
}

async function generateEventsReport(): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new();

  // Events with statistics
  const eventsResult = await query(`
    SELECT 
      e.id,
      e.name as event_name,
      e.location,
      e.email_subject,
      COUNT(DISTINCT ei.id) as total_students,
      COUNT(DISTINCT inv.id) as total_invitees,
      COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) as attended_count,
      COALESCE(ROUND(
        (COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(inv.id), 0), 
        0
      ), 0) as attendance_rate,
      TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI') as created_date
    FROM bydaya_events e
    LEFT JOIN bydaya_event_items ei ON e.id = ei.event_id AND ei.active = true
    LEFT JOIN bydaya_event_invitees inv ON e.id = inv.event_id AND inv.active = true
    WHERE e.active = true
    GROUP BY e.id, e.name, e.location, e.email_subject, e.created_at
    ORDER BY e.created_at DESC
  `);

  const eventsData = eventsResult.rows.map(row => ({
    'Event ID': row.id,
    'Event Name': row.event_name,
    'Location': row.location,
    'Email Subject': row.email_subject,
    'Total Students': row.total_students,
    'Total Invitees': row.total_invitees,
    'Attended': row.attended_count,
    'Attendance Rate (%)': row.attendance_rate,
    'Created Date': row.created_date
  }));

  const eventsSheet = XLSX.utils.json_to_sheet(eventsData);
  XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events');

  return workbook;
}

async function generateAttendanceReport(eventId?: string | null): Promise<{workbook: XLSX.WorkBook, filename: string}> {
  const workbook = XLSX.utils.book_new();

  let whereClause = `WHERE inv.active = true AND e.active = true AND ei.active = true AND inv.main_invitee = false`;
  let params: any[] = [];
  
  if (eventId) {
    whereClause += ` AND e.id = $1`;
    params.push(parseInt(eventId));
  }

  // Detailed attendance data - excluding main invitees (only additional family members)
  const attendanceResult = await query(`
    SELECT 
      e.name as event_name,
      ei.student_name,
      ei.student_id,
      inv.invitees_name,
      CASE WHEN inv.invitees_attendance THEN 'Present' ELSE 'Absent' END as attendance_status,
      CASE WHEN inv.invitees_attendance_time IS NOT NULL 
           THEN TO_CHAR(inv.invitees_attendance_time, 'YYYY-MM-DD HH24:MI') 
           ELSE '' END as attendance_time,
      CASE WHEN inv.mail_send THEN 'Yes' ELSE 'No' END as email_sent,
      TO_CHAR(e.created_at, 'YYYY-MM-DD') as event_date
    FROM bydaya_event_invitees inv
    JOIN bydaya_events e ON inv.event_id = e.id
    JOIN bydaya_event_items ei ON inv.student_item_id = ei.id
    ${whereClause}
    ORDER BY e.created_at DESC, ei.student_name
  `, params);

  // Generate filename based on event name or use default
  let filename = 'attendance_report.xlsx';
  if (attendanceResult.rows.length > 0) {
    const eventName = attendanceResult.rows[0].event_name;
    // Clean filename by removing special characters
    const cleanEventName = eventName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    filename = `${cleanEventName}_attendance_report.xlsx`;
  }

  const attendanceData = attendanceResult.rows.map(row => ({
    'Student Name': row.student_name,
    'Student ID': row.student_id,
    'Invitee Name': row.invitees_name,
    'Attendance Status': row.attendance_status,
    'Attendance Time': row.attendance_time,
    'Email Sent': row.email_sent,
    'Event Date': row.event_date
  }));

  const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');

  return { workbook, filename };
}

async function generateMonthlyReport(): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new();

  // Monthly statistics
  const monthlyResult = await query(`
    SELECT 
      TO_CHAR(e.created_at, 'Month YYYY') as month,
      COUNT(DISTINCT e.id) as events_count,
      COUNT(DISTINCT ei.id) as students_count,
      COUNT(DISTINCT inv.id) as invitees_count,
      COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) as attended_count,
      COALESCE(ROUND(
        (COUNT(CASE WHEN inv.invitees_attendance = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(inv.id), 0), 
        0
      ), 0) as attendance_rate
    FROM bydaya_events e
    LEFT JOIN bydaya_event_items ei ON e.id = ei.event_id AND ei.active = true
    LEFT JOIN bydaya_event_invitees inv ON e.id = inv.event_id AND inv.active = true
    WHERE e.active = true 
      AND e.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(e.created_at, 'Month YYYY'), DATE_TRUNC('month', e.created_at)
    ORDER BY DATE_TRUNC('month', e.created_at) DESC
  `);

  const monthlyData = monthlyResult.rows.map(row => ({
    'Month': row.month.trim(),
    'Events': row.events_count,
    'Students': row.students_count,
    'Invitees': row.invitees_count,
    'Attended': row.attended_count,
    'Attendance Rate (%)': row.attendance_rate
  }));

  const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Stats');

  return workbook;
}