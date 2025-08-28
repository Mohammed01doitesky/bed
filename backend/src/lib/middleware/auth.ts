import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

export async function authenticateToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
    ) as any;

    // Get fresh user data from database
    const result = await query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Token authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const user = await authenticateToken(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Add user to request
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest, context);
  };
}

export function requireRole(role: string) {
  return function(handler: (request: AuthenticatedRequest, context: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context: any) => {
      const user = await authenticateToken(request);

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders() }
        );
      }

      if (user.role !== role) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403, headers: corsHeaders() }
        );
      }

      // Add user to request
      (request as AuthenticatedRequest).user = user;

      return handler(request as AuthenticatedRequest, context);
    };
  };
}