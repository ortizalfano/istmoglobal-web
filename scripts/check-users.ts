import sql from '../db';
import bcrypt from 'bcryptjs';

/**
 * Check Users Script
 * Verifica cuántos usuarios hay en la base de datos
 */

async function checkUsers() {
    try {
        const users = await sql`SELECT id, email, role, created_at FROM users`;

        console.log(`\n📊 Usuarios en la base de datos: ${users.length}\n`);

        if (users.length === 0) {
            console.log('✅ No hay usuarios. No necesitas ejecutar la migración.\n');
            console.log('💡 Las nuevas contraseñas se hashearán automáticamente al registrar usuarios.\n');
        } else {
            console.log('Usuarios encontrados:\n');
            users.forEach((user: any, index: number) => {
                console.log(`${index + 1}. ${user.email} (${user.role}) - ${new Date(user.created_at).toLocaleDateString()}`);
            });
            console.log('\n⚠️  Ejecuta la migración de passwords con:');
            console.log('   npx tsx scripts/migrate-passwords.ts\n');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
}

checkUsers();
