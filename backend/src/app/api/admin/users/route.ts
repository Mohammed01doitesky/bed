import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/middleware';
import { requireRole } from '@/lib/middleware/auth';
import { UserService } from '@/lib/services/userService';

export const GET = requireRole('admin')(async (request: NextRequest) => {
  try {
    const users = await UserService.getAllUsers();

    return NextResponse.json({
      users,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
});

export const POST = requireRole('admin')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { username, email, password, role = 'admin' } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const user = await UserService.createUser({
      username,
      email,
      password,
      role
    });

    return NextResponse.json({
      user,
      success: true
    }, {
      status: 201,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
});