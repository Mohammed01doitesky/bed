import { query } from '@/lib/db/connection';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export class UserService {
  static async createUser(userData: CreateUserData): Promise<User> {
    const { username, email, password, role = 'admin' } = userData;

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await query(`
      INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, username, email, role, created_at, updated_at
    `, [username, email, password_hash, role]);

    return result.rows[0];
  }

  static async getUserById(id: number): Promise<User | null> {
    const result = await query(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const result = await query(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      WHERE username = $1
    `, [username]);

    return result.rows[0] || null;
  }

  static async getAllUsers(): Promise<User[]> {
    const result = await query(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    return result.rows;
  }

  static async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.username) {
      updates.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }

    if (userData.email) {
      updates.push(`email = $${paramCount}`);
      values.push(userData.email);
      paramCount++;
    }

    if (userData.password) {
      const password_hash = await bcrypt.hash(userData.password, 10);
      updates.push(`password_hash = $${paramCount}`);
      values.push(password_hash);
      paramCount++;
    }

    if (userData.role) {
      updates.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }

    if (updates.length === 0) {
      return await UserService.getUserById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, created_at, updated_at
    `, values);

    return result.rows[0] || null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const result = await query(`
      DELETE FROM users 
      WHERE id = $1
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }

  static async changePassword(id: number, oldPassword: string, newPassword: string): Promise<boolean> {
    // Get current password hash
    const userResult = await query(`
      SELECT password_hash FROM users WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return false;
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return false;
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const updateResult = await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `, [newPasswordHash, id]);

    return updateResult.rows.length > 0;
  }
}