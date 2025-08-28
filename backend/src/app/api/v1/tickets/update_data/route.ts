import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';
import { UpdateDataRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitees } = body as UpdateDataRequest;

    // Validate API key - check multiple sources
    let apiKey = body.api_key || request.headers.get('x-api-key');
    
    // Also check Authorization Bearer header
    const authHeader = request.headers.get('authorization');
    if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { 
          status: 401,
          headers: corsHeaders()
        }
      );
    }

    const user = await AuthService.validateApiKey(apiKey);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { 
          status: 401,
          headers: corsHeaders()
        }
      );
    }

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}