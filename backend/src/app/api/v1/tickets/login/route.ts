import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { corsHeaders } from '@/lib/middleware';
import { LoginRequest, LoginResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { db, login, password } = body;

    // Validate required fields
    if (!db || !login || !password) {
      return NextResponse.json(
        { 
          "missing error": "either of the following are missing [db, username,password]" 
        },
        { 
          status: 403,
          headers: corsHeaders()
        }
      );
    }

    // Authenticate user
    const user = await AuthService.authenticateUser(login, password);
    if (!user) {
      return NextResponse.json(
        { 
          "Access denied": "Login, password or db invalid" 
        },
        { 
          status: 401,
          headers: corsHeaders()
        }
      );
    }

    try {
      // Generate API key
      const apiKey = await AuthService.generateApiKey(user.id, user.username);
      
      const response: LoginResponse = {
        message: [{ apikey: apiKey }],
        success: true
      };

      return NextResponse.json(response, {
        status: 201,
        headers: corsHeaders()
      });

    } catch (error: any) {
      if (error.message === 'Api Key Already Exist') {
        return NextResponse.json(
          { 
            "Already Exist": "Api Key Already Exist" 
          },
          { 
            status: 403,
            headers: corsHeaders()
          }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Login error:', error);
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