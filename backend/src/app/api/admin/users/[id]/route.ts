import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/middleware';
import { requireRole } from '@/lib/middleware/auth';
import { UserService } from '@/lib/services/userService';

export const GET = requireRole('admin')(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      user,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
});

export const PUT = requireRole('admin')(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { username, email, role, password } = body;

    if (!username || !email) {
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate role if provided
    if (role && !['admin', 'manager', 'user'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin', 'manager', or 'user'" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check if username is taken by another user
    const existingUser = await UserService.getUserByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const updateData: any = { username, email, role };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const user = await UserService.updateUser(userId, updateData);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      user,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
});

export const DELETE = requireRole('admin')(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Prevent deleting the current user (should be handled in frontend too)
    const authUser = (request as any).user;
    if (authUser && authUser.id === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const deleted = await UserService.deleteUser(userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      message: "User deleted successfully",
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
});