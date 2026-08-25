import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { emailService } from '../services/email.service';
import type { MedicationReminderJobData } from '../queues/medication.queue';

export const medicationWorker = new Worker(
  'medication-queue',
  async (job: Job<MedicationReminderJobData>) => {
    console.log(`[MedicationWorker] Processing reminder job ${job.id} for "${job.data.medicineName}"...`);

    const { patientEmail, patientName, medicineName, dosage, instruction, scheduledTimeStr } = job.data;

    // Send the medication reminder email directly using emailService
    const result = await emailService.sendMedicationReminderEmail({
      email: patientEmail,
      patientName,
      medicineName,
      dosage,
      instruction
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send medication reminder email');
    }

    console.log(`[MedicationWorker] Medication reminder sent successfully for ${medicineName} at scheduled slot ${scheduledTimeStr}.`);
  },
  {
    connection: redisConnection
  }
);

medicationWorker.on('failed', (job, err) => {
  const attemptsMade = job?.attemptsMade || 0;
  const maxAttempts = job?.opts?.attempts || 3;
  
  if (attemptsMade >= maxAttempts) {
    console.error(`[MedicationWorker] Medication reminder job ${job?.id} PERMANENTLY failed after ${attemptsMade} attempts. Error: ${err.message}`);
  } else {
    console.warn(`[MedicationWorker] Medication reminder job ${job?.id} failed on attempt ${attemptsMade}/${maxAttempts}. Will retry. Error: ${err.message}`);
  }
});

medicationWorker.on('error', (err) => {
  console.error('[MedicationWorker] Worker encountered general error:', err.message || err);
});
