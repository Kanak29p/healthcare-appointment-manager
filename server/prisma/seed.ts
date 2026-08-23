import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aegishealth.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  console.log(`[Seed] Seeding admin user: ${adminEmail}`);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`[Seed] Admin user created/updated successfully with ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('[Seed Error] Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
