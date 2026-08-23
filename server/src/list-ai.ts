import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function run() {
  const summaries = await prisma.aISummary.findMany({
    include: {
      appointment: {
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } }
        }
      }
    }
  });

  console.log(`--- Database AI Summaries (${summaries.length} total) ---`);
  summaries.forEach(s => {
    console.log(`ID: ${s.id}`);
    console.log(`  Patient: ${s.appointment.patient.user.name}`);
    console.log(`  Doctor: ${s.appointment.doctor.user.name}`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Urgency: ${s.urgency}`);
    console.log(`  Chief Complaint: ${s.chiefComplaint}`);
    console.log(`  Questions: ${JSON.stringify(s.suggestedQuestions)}`);
    console.log(`-----------------------------------`);
  });

  await prisma.$disconnect();
}

run();
