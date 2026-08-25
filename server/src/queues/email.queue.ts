import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import type { 
  ConfirmationEmailData, 
  CancellationEmailData, 
  RescheduledEmailData, 
  DoctorLeaveEmailData, 
  MedicationReminderEmailData 
} from '../services/email.service';

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true, // Clean up finished jobs
    removeOnFail: false    // Leave failed jobs so admin API can read them
  }
});

export const queueConfirmationEmail = async (data: ConfirmationEmailData) => {
  return emailQueue.add('confirmation', data);
};

export const queueCancellationEmail = async (data: CancellationEmailData) => {
  return emailQueue.add('cancellation', data);
};

export const queueRescheduledEmail = async (data: RescheduledEmailData) => {
  return emailQueue.add('rescheduled', data);
};

export const queueDoctorLeaveEmail = async (data: DoctorLeaveEmailData) => {
  return emailQueue.add('doctor-leave', data);
};

export const queueMedicationReminderEmail = async (data: MedicationReminderEmailData) => {
  return emailQueue.add('medication-reminder', data);
};
