import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function run() {
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: { select: { name: true } } } },
      doctor: { include: { user: { select: { name: true } } } }
    }
  });

  console.log(`--- Database Appointments (${appointments.length} total) ---`);
  appointments.forEach(a => {
    console.log(`ID: ${a.id}`);
    console.log(`  Patient: ${a.patient.user.name} (Profile: ${a.patientId})`);
    console.log(`  Doctor: ${a.doctor.user.name} (Profile: ${a.doctorId})`);
    console.log(`  Start: ${a.startTime.toISOString()}`);
    console.log(`  End: ${a.endTime.toISOString()}`);
    console.log(`  Status: ${a.status}`);
    console.log(`  HoldExpiresAt: ${a.holdExpiresAt?.toISOString()}`);
    console.log(`-----------------------------------`);
  });

  await prisma.$disconnect();
}

run();
