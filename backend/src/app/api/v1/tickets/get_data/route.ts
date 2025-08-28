import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';
import { GetDataRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitees_qrcode_text } = body as GetDataRequest;

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}