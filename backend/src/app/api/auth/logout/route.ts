import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // In a more sophisticated setup, you might want to:
    // 1. Invalidate the JWT token on the server side (blacklist)
    // 2. Clear server-side session data
    // 3. Log the logout event

    return NextResponse.json({
      message: "Logged out successfully",
      success: true
    }, {
      status: 200,
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