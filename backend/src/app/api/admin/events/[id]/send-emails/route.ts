import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';
import { corsHeaders } from '@/lib/middleware';
import { query } from '@/lib/db/connection';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = parseInt(resolvedParams.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { 
          status: 400,
          headers: corsHeaders()
        }
      );
    }

    // Verify event exists
    const eventResult = await query(
      'SELECT id, name FROM bydaya_events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { 
          status: 404,
          headers: corsHeaders()
        }
      );
    }

    // Send emails to all invitees
    const result = await EmailService.sendEventInviteEmails(eventId);

    if (result.success) {
      return NextResponse.json(
        {
          message: `Successfully sent ${result.sent} emails. ${result.failed} failed.`,
          success: true,
          sent: result.sent,
          failed: result.failed
        },
        {
          status: 200,
          headers: corsHeaders()
        }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send emails',
          sent: result.sent,
          failed: result.failed
        },
        { 
          status: 500,
          headers: corsHeaders()
        }
      );
    }

  } catch (error) {
    console.error('Send emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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