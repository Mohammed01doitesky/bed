import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';

export async function authenticateApiKey(request: NextRequest): Promise<NextResponse | null> {
  try {
    const body = await request.text();
    const data = JSON.parse(body);
    const apiKey = data.api_key || request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const user = await AuthService.validateApiKey(apiKey);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    // Add user to request context (you can extend this as needed)
    return null; // Continue to the actual handler
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  };
}