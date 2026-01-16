import sql from './api/db.js';
import bcrypt from 'bcryptjs';

/**
 * Migration Script: Hash Existing Plain Text Passwords
 * 
 * This script updates all existing users with plain text passwords
 * to use bcrypt hashed passwords.
 * 
 * ⚠️ IMPORTANT: Run this ONLY ONCE after deploying the bcrypt changes
 */

async function migratePasswords() {
    console.log('🔒 Starting password migration...\n');

    try {
        // Get all users
        const users = await sql`SELECT id, email, password FROM users`;

        console.log(`Found ${users.length} users to check\n`);

        let migrated = 0;
        let skipped = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
                console.log(`⏭️  Skipping ${user.email} (already hashed)`);
                skipped++;
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Update the user with hashed password
            await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${user.id}`;

            console.log(`✅ Migrated ${user.email}`);
            migrated++;
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   Migrated: ${migrated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${users.length}\n`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run migration
migratePasswords();
