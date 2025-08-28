#!/usr/bin/env bun

import { query } from './connection';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');

    // Create migrations table to track which migrations have been run
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all SQL files from the database/init directory
    const migrationsDir = path.join(process.cwd(), 'database', 'init');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    for (const file of migrationFiles) {
      // Check if migration has already been run
      const existingMigration = await query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );

      if (existingMigration.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`📝 Running migration: ${file}`);
      
      // Read and execute the migration file
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      
      // Execute the migration
      await query(migrationSQL);
      
      // Mark migration as completed
      await query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [file]
      );

      console.log(`✅ Completed migration: ${file}`);
    }

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().then(() => {
    console.log('✨ Migration script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { runMigrations };