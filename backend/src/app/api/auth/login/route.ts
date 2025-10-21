import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/middleware';
import { query } from '@/lib/db/connection';
import { AuthService } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Find user in database
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders() }
      );
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Check if user has web access permission
    const hasWebAccess = await AuthService.hasPermission(user, 'web');
    if (!hasWebAccess) {
      return NextResponse.json(
        { error: "Access denied. Your account type does not have web access permissions." },
        { status: 403, headers: corsHeaders() }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return NextResponse.json({
      user: userData,
      token,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

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

// Generate password hash for setup (remove in production)
// bcrypt.hash('admin123', 10).then(console.log);