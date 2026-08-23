import { PrismaClient, Role } from '@prisma/client';
import { LLMService } from './services/llm.service';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function testAISummary() {
  console.log('[AI Summary Test] Fetching test entities...');

  const doctor = await prisma.doctorProfile.findFirst({
    include: { user: true }
  });
  const patient = await prisma.patientProfile.findFirst({
    include: { user: true }
  });

  if (!doctor || !patient) {
    console.error('Test requires at least 1 doctor and 1 patient profile.');
    process.exit(1);
  }

  // Create temporary appointment
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 5);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  console.log('[AI Summary Test] Creating a test appointment...');
  const appt = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      startTime,
      endTime,
      status: 'CONFIRMED'
    }
  });

  const symptoms = 'I have had a high fever (102F) and severe dry coughing for 4 days. My throat is extremely sore and it hurts to swallow. I am also experiencing chills.';
  console.log(`[AI Summary Test] Patient Symptoms: "${symptoms}"`);

  // Test Case 1: Simulated Failure
  console.log('\n--- TEST CASE 1: Simulated LLM Service Failure ---');
  process.env.SIMULATE_LLM_FAILURE = 'true';
  try {
    console.log('Generating pre-visit summary with failure flag...');
    await LLMService.generatePreVisitSummary(symptoms);
    console.log('❌ Failure: Expected LLM generation to throw an error.');
  } catch (err: any) {
    console.log(`✅ Success: LLM threw expected error: "${err.message}"`);
    
    // Log failed status in database
    const failedSummary = await prisma.aISummary.create({
      data: {
        appointmentId: appt.id,
        status: 'FAILED',
        suggestedQuestions: []
      }
    });

    console.log(`Saved failed summary to DB: ID=${failedSummary.id}, Status=${failedSummary.status}`);
    
    // Clean up
    await prisma.aISummary.delete({ where: { id: failedSummary.id } });
  }

  // Test Case 2: LLM Success (requires real API key, otherwise skip)
  console.log('\n--- TEST CASE 2: Real Gemini API Summary Generation ---');
  process.env.SIMULATE_LLM_FAILURE = 'false';
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ Skipping Case 2: GEMINI_API_KEY is not defined. Set GEMINI_API_KEY to test the live API.');
  } else {
    try {
      console.log('Sending request to Gemini API (gemini-1.5-flash)...');
      const aiResult = await LLMService.generatePreVisitSummary(symptoms);
      console.log('✅ Success: Received response from Gemini!');
      console.log('Generated AI Response:', JSON.stringify(aiResult, null, 2));

      // Save to database
      const successSummary = await prisma.aISummary.create({
        data: {
          appointmentId: appt.id,
          urgency: aiResult.urgency,
          chiefComplaint: aiResult.chiefComplaint,
          suggestedQuestions: aiResult.suggestedQuestions,
          status: 'SUCCESS'
        }
      });
      console.log(`Saved success summary to DB: ID=${successSummary.id}, Status=${successSummary.status}`);

      // Verify fields
      if (successSummary.urgency && successSummary.chiefComplaint && successSummary.suggestedQuestions.length === 3) {
        console.log('✅ Database fields verified successfully!');
      } else {
        console.log('❌ Failure: Database summary fields are incomplete or invalid.');
      }

      // Cleanup summary
      await prisma.aISummary.delete({ where: { id: successSummary.id } });
    } catch (err: any) {
      console.error('❌ Case 2 Failed: unexpected error:', err.message);
    }
  }

  // Clean up appointment
  await prisma.appointment.delete({ where: { id: appt.id } });
  await prisma.$disconnect();
  console.log('\n[AI Summary Test] All test runs completed.');
}

testAISummary();
