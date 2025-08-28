import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from './db/connection';
import { User, ApiKey } from '@/types';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

  static async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1 OR email = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  static async generateApiKey(userId: number, username: string): Promise<string> {
    try {
      // Check if user already has an active API key
      const existingKey = await query(
        'SELECT * FROM api_keys WHERE user_id = $1 AND key_name = $2 AND is_active = true',
        [userId, `Bedayia ApiKey For ${username}`]
      );

      if (existingKey.rows.length > 0) {
        const apiKey = existingKey.rows[0];
        
        // Check if key is expired
        if (apiKey.expires_at && new Date() > new Date(apiKey.expires_at)) {
          // Delete expired key
          await query('DELETE FROM api_keys WHERE id = $1', [apiKey.id]);
        } else {
          throw new Error('Api Key Already Exist');
        }
      }

      // Generate new API key
      const apiKey = uuidv4().replace(/-/g, '');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiry

      await query(
        'INSERT INTO api_keys (user_id, key_name, api_key, expires_at) VALUES ($1, $2, $3, $4)',
        [userId, `Bedayia ApiKey For ${username}`, apiKey, expiresAt]
      );

      return apiKey;
    } catch (error) {
      throw error;
    }
  }

  static async validateApiKey(apiKey: string): Promise<User | null> {
    try {
      const result = await query(`
        SELECT u.* FROM users u
        JOIN api_keys ak ON u.id = ak.user_id
        WHERE ak.api_key = $1 AND ak.is_active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
      `, [apiKey]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  static async revokeApiKey(apiKey: string, username: string): Promise<void> {
    try {
      await query(
        'DELETE FROM api_keys WHERE api_key = $1 AND key_name = $2',
        [apiKey, `Bedayia ApiKey For ${username}`]
      );
    } catch (error) {
      console.error('API key revocation error:', error);
      throw error;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async createUser(username: string, email: string, password: string): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, passwordHash]
    );

    return result.rows[0];
  }
}