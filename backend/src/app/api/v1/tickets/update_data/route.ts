import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';
import { withRoleAuth } from '@/lib/middleware/roleAuth';
import { UpdateDataRequest } from '@/types';
import { User } from '@/types';

async function handleUpdateData(request: NextRequest, context: any, user: User): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitees } = body as UpdateDataRequest;

    // Validate required fields
    if (!invitees || !Array.isArray(invitees)) {
      return NextResponse.json(
        { error: 'invitees array is required' },
        {
          status: 400,
          headers: corsHeaders()
        }
      );
    }

    // Update attendance data
    const result = await EventService.updateInviteesAttendance({ invitees });

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Update data error:', error);
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
export const POST = withRoleAuth(handleUpdateData, 'api');

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}