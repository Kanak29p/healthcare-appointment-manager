import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { emailService } from '../services/email.service';

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    console.log(`[EmailWorker] Processing job ${job.id} of type "${job.name}"...`);

    const { name, data } = job;

    switch (name) {
      case 'confirmation': {
        const result = await emailService.sendAppointmentConfirmationEmail(data);
        if (!result.success) throw new Error(result.error || 'Failed to send confirmation email');
        break;
      }
      case 'cancellation': {
        const result = await emailService.sendAppointmentCancellationEmail(data);
        if (!result.success) throw new Error(result.error || 'Failed to send cancellation email');
        break;
      }
      case 'rescheduled': {
        const result = await emailService.sendAppointmentRescheduledEmail(data);
        if (!result.success) throw new Error(result.error || 'Failed to send reschedule email');
        break;
      }
      case 'doctor-leave': {
        const result = await emailService.sendDoctorLeaveEmail(data);
        if (!result.success) throw new Error(result.error || 'Failed to send doctor leave email');
        break;
      }
      case 'medication-reminder': {
        const result = await emailService.sendMedicationReminderEmail(data);
        if (!result.success) throw new Error(result.error || 'Failed to send medication reminder email');
        break;
      }
      default: {
        console.warn(`[EmailWorker] Unknown job name "${name}" on job ID ${job.id}`);
        break;
      }
    }

    console.log(`[EmailWorker] Job ${job.id} completed successfully.`);
  },
  {
    connection: redisConnection
  }
);

emailWorker.on('failed', (job, err) => {
  const attemptsMade = job?.attemptsMade || 0;
  const maxAttempts = job?.opts?.attempts || 3;
  
  if (attemptsMade >= maxAttempts) {
    console.error(`[EmailWorker] Job ${job?.id} PERMANENTLY failed after ${attemptsMade} attempts. Error: ${err.message}`);
  } else {
    console.warn(`[EmailWorker] Job ${job?.id} failed on attempt ${attemptsMade}/${maxAttempts}. Will retry. Error: ${err.message}`);
  }
});

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] Worker encountered general error:', err.message || err);
});
