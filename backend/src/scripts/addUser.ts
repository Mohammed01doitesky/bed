#!/usr/bin/env bun

import { AuthService } from '../lib/auth';

async function addUser() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log('Usage: bun run addUser.ts <username> <email> <password> <role>');
    console.log('Roles: admin, manager, user');
    process.exit(1);
  }

  const [username, email, password, role] = args;

  if (!['admin', 'manager', 'user'].includes(role)) {
    console.error('Invalid role. Must be: admin, manager, or user');
    process.exit(1);
  }

  try {
    const user = await AuthService.createUser(
      username,
      email,
      password,
      role as 'admin' | 'manager' | 'user'
    );

    console.log('✅ User created successfully:');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

addUser();