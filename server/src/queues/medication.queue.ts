import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export interface MedicationReminderJobData {
  patientEmail: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  instruction: string;
  medicationId: string;
  scheduledTimeStr: string; // ISO string or human format
}

export const medicationQueue = new Queue('medication-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Schedules a delayed medication reminder job in BullMQ.
 * Uses a deterministic jobId: medication-{medicationId}-{YYYY-MM-DD}-{HH-mm}
 */
export const scheduleMedicationReminder = async (
  medicationId: string,
  dateTime: Date,
  data: Omit<MedicationReminderJobData, 'medicationId' | 'scheduledTimeStr'>
) => {
  const YYYY = dateTime.getUTCFullYear();
  const MM = String(dateTime.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(dateTime.getUTCDate()).padStart(2, '0');
  const HH = String(dateTime.getUTCHours()).padStart(2, '0');
  const mm = String(dateTime.getUTCMinutes()).padStart(2, '0');

  const deterministicId = `medication-${medicationId}-${YYYY}-${MM}-${DD}-${HH}-${mm}`;
  const delay = Math.max(0, dateTime.getTime() - Date.now());

  const jobData: MedicationReminderJobData = {
    ...data,
    medicationId,
    scheduledTimeStr: `${YYYY}-${MM}-${DD} ${HH}:${mm} UTC`
  };

  console.log(`[MedicationQueue] Queueing reminder for ${data.medicineName} (jobId: ${deterministicId}) with delay: ${delay}ms`);

  // BullMQ will ignore duplicate jobIds if they already exist in the queue (delayed/waiting/active)
  return medicationQueue.add('reminder-job', jobData, {
    jobId: deterministicId,
    delay
  });
};
