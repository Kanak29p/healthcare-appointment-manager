import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function run() {
  console.log('[Concurrency Test] Fetching active doctor and patient profiles...');
  
  // Find doctor and patient profiles
  const doctor = await prisma.doctorProfile.findFirst({
    where: { isActive: true }
  });
  
  const patients = await prisma.patientProfile.findMany({
    take: 2
  });

  if (!doctor || patients.length < 2) {
    console.error('[Concurrency Test] Failure: Seeding is required. Test requires 1 active doctor and 2 patients.');
    process.exit(1);
  }

  // Create a slot tomorrow at 10:00 AM UTC
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 2);
  startTime.setUTCHours(10, 0, 0, 0);

  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  console.log(`[Concurrency Test] Slot Target: ${startTime.toISOString()}`);
  console.log(`[Concurrency Test] Doctor Profile ID: ${doctor.id}`);
  console.log(`[Concurrency Test] Patient 1 Profile ID: ${patients[0].id}`);
  console.log(`[Concurrency Test] Patient 2 Profile ID: ${patients[1].id}`);

  // Delete any existing conflicts at this time
  await prisma.appointment.deleteMany({
    where: {
      doctorId: doctor.id,
      startTime
    }
  });

  console.log('[Concurrency Test] Launching parallel slot booking inserts...');

  const promises = [
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        startTime,
        endTime,
        status: 'HELD',
        holdExpiresAt: new Date(Date.now() + 2 * 60 * 1000)
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        startTime,
        endTime,
        status: 'HELD',
        holdExpiresAt: new Date(Date.now() + 2 * 60 * 1000)
      }
    })
  ];

  try {
    const results = await Promise.allSettled(promises);
    
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected') as any[];

    console.log('\n--- Concurrency Test Results ---');
    console.log(`Fulfilled inserts: ${fulfilled.length}`);
    console.log(`Rejected inserts: ${rejected.length}`);

    if (fulfilled.length === 1 && rejected.length === 1) {
      console.log('✅ SUCCESS: The database-level constraint correctly prevented duplicate booking of the same slot.');
      console.log(`Error reason: ${rejected[0].reason.message}`);
    } else {
      console.log('❌ FAILURE: Expected exactly one request to succeed and one to fail.');
    }
  } catch (err) {
    console.error('[Concurrency Test] Unexpected error', err);
  } finally {
    // Cleanup the test appointment
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        startTime
      }
    });
    await prisma.$disconnect();
  }
}

run();
