import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { corsHeaders } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, username } = body;

    // Validate required fields
    if (!api_key || !username) {
      return NextResponse.json(
        { 
          "missing error": "either of the following are missing [api_key, username]" 
        },
        { 
          status: 403,
          headers: corsHeaders()
        }
      );
    }

    // Validate API key first
    const user = await AuthService.validateApiKey(api_key);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired API key" },
        { 
          status: 401,
          headers: corsHeaders()
        }
      );
    }

    // Revoke the API key
    await AuthService.revokeApiKey(api_key, username);

    const response = {
      message: "API KEY Successfully Removed",
      success: true
    };

    return NextResponse.json(response, {
      status: 201,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Logout error:', error);
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