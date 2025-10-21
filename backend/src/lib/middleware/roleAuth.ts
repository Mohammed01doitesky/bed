import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { User } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Middleware to check if user has web access permission
 * Blocks 'user' role from accessing web pages
 */
export async function requireWebAccess(request: NextRequest): Promise<NextResponse | null> {
  try {
    // For API routes, allow through (they have their own auth)
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return null;
    }

    // Get session/auth token from cookies or headers
    const authToken = request.cookies.get('auth-token')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      // No auth token - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For now, we'll need to implement session validation
    // This is a placeholder - you may want to implement JWT or session-based auth
    const user = await validateSession(authToken);

    if (!user) {
      // Invalid session - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has web access
    const hasWebAccess = await AuthService.hasPermission(user, 'web');

    if (!hasWebAccess) {
      // User type cannot access web - show access denied page
      return NextResponse.json(
        { error: 'Access denied. Your account type does not have web access permissions.' },
        { status: 403 }
      );
    }

    // User has access, continue
    return null;

  } catch (error) {
    console.error('Web access middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Middleware to check if user has API access permission
 */
export async function requireApiAccess(user: User): Promise<boolean> {
  try {
    return await AuthService.hasPermission(user, 'api');
  } catch (error) {
    console.error('API access check error:', error);
    return false;
  }
}

// Placeholder function - implement based on your session management strategy
async function validateSession(token: string): Promise<User | null> {
  try {
    // This could be JWT validation, database session lookup, etc.
    // For now, check if it's an API key and get the associated user
    const user = await AuthService.validateApiKey(token);
    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Higher-order function to protect API routes with role checking
 */
export function withRoleAuth(
  handler: (request: NextRequest, context: any, user: User) => Promise<NextResponse>,
  requiredPermission: 'web' | 'api' = 'api'
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Extract API key from request
      let apiKey = request.headers.get('x-api-key');

      // Also check Authorization Bearer header
      const authHeader = request.headers.get('authorization');
      if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      }

      // Note: We don't check the request body for api_key here to avoid consuming the stream
      // The individual handlers can check for api_key in the body if needed

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

      // Check if user has the required permission
      const hasPermission = await AuthService.hasPermission(user, requiredPermission);
      if (!hasPermission) {
        return NextResponse.json(
          { error: `Access denied. Your account type does not have ${requiredPermission} access permissions.` },
          { status: 403 }
        );
      }

      // Call the original handler with the authenticated user
      return handler(request, context, user);

    } catch (error) {
      console.error('Role auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}