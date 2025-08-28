#!/usr/bin/env bun

import { query } from './connection';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insert or update default admin user
    await query(`
      INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (username) 
      DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, username, role
    `, ['admin', 'admin@bedayia.school', hashedPassword, 'admin']);

    console.log('✅ Default admin user created/updated:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@bedayia.school');
    console.log('   Role: admin');

    // You can add more seed data here, for example:
    
    // Create sample events if none exist
    const eventsResult = await query('SELECT COUNT(*) as count FROM bydaya_events WHERE active = true');
    const eventCount = parseInt(eventsResult.rows[0].count);

    if (eventCount === 0) {
      console.log('📅 Creating sample event...');
      
      await query(`
        INSERT INTO bydaya_events (name, location, email_subject, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, ['Graduation Ceremony 2025', 'Main Auditorium', 'Graduation Invitation - Bedayia School']);

      console.log('✅ Sample event created: Graduation Ceremony 2025');
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('✨ Seeding script finished. You can now log in with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    process.exit(0);
  }).catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
}

export { seedDatabase };