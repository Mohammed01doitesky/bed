import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';
import { corsHeaders } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Get detailed report for specific event
      const eventIdNum = parseInt(eventId);
      if (isNaN(eventIdNum)) {
        return NextResponse.json(
          { error: 'Invalid event ID' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const detailedReport = await EmailService.getDetailedEmailReport(eventIdNum);
      return NextResponse.json(detailedReport, {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      // Get general email statistics across all events
      const emailStats = await EmailService.getEmailStatistics();
      return NextResponse.json(emailStats, {
        status: 200,
        headers: corsHeaders()
      });
    }

  } catch (error) {
    console.error('Email reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email reports' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}