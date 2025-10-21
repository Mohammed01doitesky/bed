import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';
import { withRoleAuth } from '@/lib/middleware/roleAuth';
import { GetDataRequest } from '@/types';
import { User } from '@/types';

async function handleGetData(request: NextRequest, context: any, user: User): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitees_qrcode_text } = body as GetDataRequest;

    // Validate required fields
    if (!invitees_qrcode_text) {
      return NextResponse.json(
        { error: 'invitees_qrcode_text is required' },
        {
          status: 400,
          headers: corsHeaders()
        }
      );
    }

    // Get invitees data
    const result = await EventService.getInviteesByQRCode(invitees_qrcode_text);

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

// Export with role-based authentication - requires API access (user, manager, admin can use)
export const POST = withRoleAuth(handleGetData, 'api');

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}