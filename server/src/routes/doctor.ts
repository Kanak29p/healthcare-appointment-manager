import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { LLMService } from '../services/llm.service';

const router = Router();
const prisma = new PrismaClient();

// Validators
const consultationSchema = z.object({
  notes: z.string().min(1, 'Consultation notes cannot be empty')
});

const medicationItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name cannot be empty'),
  dosage: z.string().min(1, 'Dosage cannot be empty'),
  frequency: z.enum(['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'AS_NEEDED']),
  duration: z.string().min(1, 'Duration cannot be empty')
});

const prescriptionSchema = z.object({
  instructions: z.string().default(''),
  medications: z.array(medicationItemSchema).min(1, 'At least one medication is required')
});

// Protect all routes with authentication and DOCTOR role check
router.use(authenticate);
router.use(authorize(Role.DOCTOR));

// Helper: Verify appointment exists, belongs to doctor, and check its status if required
async function verifyDoctorAppointment(appointmentId: string, doctorUserId: string, next: any, allowedStatuses?: string[]) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId }
  });

  if (!doctorProfile) {
    throw new AppError('Doctor profile not found', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: {
          user: { select: { name: true } }
        }
      },
      doctor: true,
      symptom: true,
      aiSummary: true,
      consultation: {
        include: {
          prescription: {
            include: {
              medications: true
            }
          }
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.doctorId !== doctorProfile.id) {
    throw new AppError('Access denied: You are not the assigned doctor for this appointment', 403);
  }

  if (allowedStatuses && !allowedStatuses.includes(appointment.status)) {
    throw new AppError(`Appointment status must be one of: ${allowedStatuses.join(', ')}`, 400);
  }

  return { appointment, doctorProfile };
}

// 1. GET /api/doctor/appointments/:appointmentId
router.get('/doctor/appointments/:appointmentId', async (req: AuthRequest, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { appointment } = await verifyDoctorAppointment(appointmentId, req.user!.id, next);

    res.status(200).json({
      success: true,
      appointment: {
        id: appointment.id,
        patientName: appointment.patient.user.name,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        status: appointment.status,
        symptoms: appointment.symptom?.description || null,
        aiSummary: appointment.aiSummary ? {
          status: appointment.aiSummary.status,
          urgency: appointment.aiSummary.urgency,
          chiefComplaint: appointment.aiSummary.chiefComplaint,
          suggestedQuestions: appointment.aiSummary.suggestedQuestions
        } : null,
        consultation: appointment.consultation ? {
          id: appointment.consultation.id,
          notes: appointment.consultation.notes,
          prescription: appointment.consultation.prescription ? {
            instructions: appointment.consultation.prescription.instructions,
            medications: appointment.consultation.prescription.medications.map(med => ({
              medicineName: med.medicineName,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration
            }))
          } : null
        } : null
      }
    });
  } catch (err: any) {
    next(err);
  }
});

// 2. POST /api/doctor/appointments/:appointmentId/consultation
router.post('/doctor/appointments/:appointmentId/consultation', async (req: AuthRequest, res, next) => {
  try {
    const { appointmentId } = req.params;
    
    const parseResult = consultationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }
    
    const { notes } = parseResult.data;

    // Verify appointment exists, is owned by doctor, and is CONFIRMED
    const { appointment } = await verifyDoctorAppointment(appointmentId, req.user!.id, next, ['CONFIRMED']);

    const consultation = await prisma.consultation.upsert({
      where: { appointmentId },
      update: { notes },
      create: { appointmentId, notes }
    });

    res.status(200).json({
      success: true,
      message: 'Consultation notes saved successfully',
      consultation
    });
  } catch (err: any) {
    next(err);
  }
});

// 3. POST /api/doctor/appointments/:appointmentId/prescription
router.post('/doctor/appointments/:appointmentId/prescription', async (req: AuthRequest, res, next) => {
  try {
    const { appointmentId } = req.params;

    const parseResult = prescriptionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { instructions, medications } = parseResult.data;

    // Verify appointment exists, owned by doctor, and is CONFIRMED
    const { appointment } = await verifyDoctorAppointment(appointmentId, req.user!.id, next, ['CONFIRMED']);

    // Check if consultation notes have been saved first
    if (!appointment.consultation) {
      return next(new AppError('Please save consultation notes before creating a prescription', 400));
    }

    const consultationId = appointment.consultation.id;

    // Database transaction to overwrite prescription + medications
    const updatedPrescription = await prisma.$transaction(async (tx) => {
      const existingPrescription = await tx.prescription.findUnique({
        where: { consultationId }
      });

      if (existingPrescription) {
        // Delete existing medications
        await tx.medication.deleteMany({
          where: { prescriptionId: existingPrescription.id }
        });

        // Update instructions and create new medications
        return tx.prescription.update({
          where: { id: existingPrescription.id },
          data: {
            instructions,
            medications: {
              create: medications.map(med => ({
                medicineName: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration
              }))
            }
          },
          include: { medications: true }
        });
      } else {
        // Create new prescription
        return tx.prescription.create({
          data: {
            consultationId,
            instructions,
            medications: {
              create: medications.map(med => ({
                medicineName: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration
              }))
            }
          },
          include: { medications: true }
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Prescription saved successfully',
      prescription: updatedPrescription
    });
  } catch (err: any) {
    next(err);
  }
});

// 4. POST /api/doctor/appointments/:appointmentId/complete
router.post('/doctor/appointments/:appointmentId/complete', async (req: AuthRequest, res, next) => {
  try {
    const { appointmentId } = req.params;

    // Verify appointment exists, is owned by doctor, and is CONFIRMED
    const { appointment } = await verifyDoctorAppointment(appointmentId, req.user!.id, next, ['CONFIRMED']);

    // Consultation notes must exist
    if (!appointment.consultation) {
      return next(new AppError('Clinical consultation notes must exist to complete the appointment', 400));
    }

    // Set appointment status to COMPLETED
    const completedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' }
    });

    // Create a PostVisitSummary record with PENDING state
    let postVisitSummary = await prisma.postVisitSummary.upsert({
      where: { appointmentId },
      update: { status: 'PENDING' },
      create: { appointmentId, status: 'PENDING', followUpSteps: [] }
    });

    // Trigger AI Post-Visit Summary Generation
    const notes = appointment.consultation.notes;
    const instructions = appointment.consultation.prescription?.instructions || '';
    const medications = appointment.consultation.prescription?.medications || [];

    try {
      console.log(`[AI Post-Visit Summary] Generating summary for appointment: ${appointmentId}...`);
      const aiResult = await LLMService.generatePostVisitSummary(notes, instructions, medications);

      // Save success summary to DB
      postVisitSummary = await prisma.postVisitSummary.update({
        where: { appointmentId },
        data: {
          summary: aiResult.summary,
          medicationSchedule: aiResult.medicationSchedule,
          followUpSteps: aiResult.followUpSteps,
          status: 'SUCCESS'
        }
      });
      console.log(`[AI Post-Visit Summary] Success: Saved for appointment: ${appointmentId}`);
    } catch (llmErr: any) {
      console.error(`[AI Post-Visit Summary Failed] Technical error: ${llmErr.message}`);

      // Save FAILED status to DB
      postVisitSummary = await prisma.postVisitSummary.update({
        where: { appointmentId },
        data: {
          status: 'FAILED'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: postVisitSummary.status === 'SUCCESS'
        ? 'Appointment completed and AI summary generated.'
        : 'Appointment completed. Post-visit summary is temporarily unavailable.',
      appointment: completedAppointment,
      postVisitSummary: {
        status: postVisitSummary.status,
        summary: postVisitSummary.summary,
        medicationSchedule: postVisitSummary.medicationSchedule,
        followUpSteps: postVisitSummary.followUpSteps
      }
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
