import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { cleanupExpiredHolds } from '../utils/hold';
import { LLMService } from '../services/llm.service';

const router = Router();
const prisma = new PrismaClient();

// Validators
const holdSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  startTime: z.string().datetime('Start time must be a valid ISO DateTime string'),
  endTime: z.string().datetime('End time must be a valid ISO DateTime string')
});

const confirmSchema = z.object({
  symptoms: z.string().min(5, 'Symptoms description must be at least 5 characters')
});

const rescheduleSchema = z.object({
  startTime: z.string().datetime('Start time must be a valid ISO DateTime string'),
  endTime: z.string().datetime('End time must be a valid ISO DateTime string')
});

// Protect all routes with authentication
router.use(authenticate);

// 1. Hold Slot
// POST /api/appointments/hold
router.post('/appointments/hold', authorize(Role.PATIENT), async (req: AuthRequest, res, next) => {
  try {
    const parseResult = holdSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { doctorId, startTime, endTime } = parseResult.data;

    // Clean up expired slot holds first
    await cleanupExpiredHolds();

    // Verify doctor exists and is active
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        doctorProfile: { isActive: true }
      },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Active doctor profile not found', 404));
    }

    // Get the patient profile
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!patientProfile) {
      return next(new AppError('Patient profile not found', 400));
    }

    const holdDate = new Date(startTime);
    const holdEndDate = new Date(endTime);

    // Verify doctor is not on leave
    const checkDate = new Date(holdDate);
    checkDate.setUTCHours(0, 0, 0, 0);

    const isLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id,
        leaveDate: checkDate
      }
    });

    if (isLeave) {
      return next(new AppError('Doctor is on leave on this date', 400));
    }

    // Verify doctor working hours
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = weekdays[holdDate.getUTCDay()];

    const availabilities = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctor.doctorProfile.id,
        dayOfWeek: dayOfWeekName
      }
    });

    const startMin = holdDate.getUTCHours() * 60 + holdDate.getUTCMinutes();
    const endMin = holdEndDate.getUTCHours() * 60 + holdEndDate.getUTCMinutes();

    const isWorking = availabilities.some(avail => {
      const [aStartH, aStartM] = avail.startTime.split(':').map(Number);
      const [aEndH, aEndM] = avail.endTime.split(':').map(Number);
      const aStartMin = aStartH * 60 + aStartM;
      const aEndMin = aEndH * 60 + aEndM;
      return startMin >= aStartMin && endMin <= aEndMin;
    });

    if (!isWorking) {
      return next(new AppError('Doctor is not working during this time slot', 400));
    }

    // Verify the slot is not already held or booked
    const existingAppt = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id, // Search using DoctorProfile key
        startTime: holdDate,
        status: { in: ['CONFIRMED', 'HELD'] }
      }
    });

    if (existingAppt) {
      if (existingAppt.status === 'HELD' && existingAppt.patientId === patientProfile.id) {
        const holdExpiresAt = new Date(Date.now() + 2 * 60 * 1000);
        const updated = await prisma.appointment.update({
          where: { id: existingAppt.id },
          data: { holdExpiresAt }
        });
        return res.status(201).json({
          success: true,
          message: 'Appointment slot hold renewed',
          appointment: updated
        });
      }
      return next(new AppError('This slot is already booked or held by another patient', 400));
    }

    // Create HELD appointment with 2 minutes expiration
    const holdExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    try {
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patientProfile.id,
          doctorId: doctor.doctorProfile.id, // Save using DoctorProfile key
          startTime: holdDate,
          endTime: holdEndDate,
          status: 'HELD',
          holdExpiresAt
        }
      });

      res.status(201).json({
        success: true,
        message: 'Appointment slot is temporarily held for 2 minutes',
        appointment
      });
    } catch (dbErr: any) {
      // Catch unique index block failure (P2002)
      if (dbErr.code === 'P2002') {
        return next(new AppError('This slot was just booked by another patient.', 400));
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
});

// 2. Confirm Appointment
// POST /api/appointments/:id/confirm
router.post('/appointments/:id/confirm', authorize(Role.PATIENT), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const parseResult = confirmSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { symptoms } = parseResult.data;

    // Clean up expired holds first
    await cleanupExpiredHolds();

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!appointment) {
      return next(new AppError('Appointment hold record not found', 404));
    }

    // Verify ownership
    if (appointment.patient.userId !== req.user!.id) {
      return next(new AppError('Access denied, unauthorized operation', 403));
    }

    // Verify HELD status and hold has not expired
    if (appointment.status !== 'HELD') {
      return next(new AppError('Appointment is not in a pending hold state', 400));
    }

    if (appointment.holdExpiresAt && appointment.holdExpiresAt < new Date()) {
      return next(new AppError('Hold has expired. Please select the slot again.', 400));
    }

    // Update status to CONFIRMED and add symptoms description in transaction
    const confirmedAppointment = await prisma.$transaction(async (tx) => {
      // Re-verify slot availability just in case
      const checkAgain = await tx.appointment.findUnique({
        where: { id }
      });

      if (!checkAgain || checkAgain.status !== 'HELD' || (checkAgain.holdExpiresAt && checkAgain.holdExpiresAt < new Date())) {
        throw new Error('Hold expired during transaction process');
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          holdExpiresAt: null, // Clear hold timer
          symptom: {
            create: {
              description: symptoms
            }
          }
        },
        include: {
          symptom: true
        }
      });
      
      return updated;
    });

    // Attempt AI summary generation. The LLM call MUST NOT fail appointment confirmation
    let aiSummaryResponse: any = null;
    try {
      console.log(`[AI Summary] Generating pre-visit summary for appointment: ${id}...`);
      const aiResult = await LLMService.generatePreVisitSummary(symptoms);
      
      const aiSummary = await prisma.aISummary.create({
        data: {
          appointmentId: id,
          urgency: aiResult.urgency,
          chiefComplaint: aiResult.chiefComplaint,
          suggestedQuestions: aiResult.suggestedQuestions,
          status: 'SUCCESS'
        }
      });

      console.log(`[AI Summary] Successfully created pre-visit summary for appointment: ${id}`);
      aiSummaryResponse = {
        status: 'SUCCESS',
        urgency: aiSummary.urgency,
        chiefComplaint: aiSummary.chiefComplaint,
        suggestedQuestions: aiSummary.suggestedQuestions
      };
    } catch (llmErr: any) {
      console.error(`[AI Summary Failed] Technical error occurred:`, llmErr.message);
      
      // Save FAILED status summary to DB
      const aiSummary = await prisma.aISummary.create({
        data: {
          appointmentId: id,
          status: 'FAILED',
          suggestedQuestions: []
        }
      });

      aiSummaryResponse = {
        status: 'FAILED'
      };
    }

    res.status(200).json({
      success: true,
      message: aiSummaryResponse.status === 'SUCCESS' 
        ? 'Appointment confirmed' 
        : 'Appointment confirmed. AI summary is temporarily unavailable.',
      appointment: confirmedAppointment,
      aiSummary: aiSummaryResponse
    });
  } catch (err: any) {
    if (err.message === 'Hold expired during transaction process') {
      return next(new AppError('Hold has expired. Please select the slot again.', 400));
    }
    next(err);
  }
});

// 3. Cancel Appointment
// PATCH /api/appointments/:id/cancel
router.patch('/appointments/:id/cancel', authorize(Role.PATIENT), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    // Verify patient owns it
    if (appointment.patient.userId !== req.user!.id) {
      return next(new AppError('Access denied, unauthorized operation', 403));
    }

    if (appointment.status === 'CANCELLED') {
      return next(new AppError('Appointment is already cancelled', 400));
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updated
    });
  } catch (err) {
    next(err);
  }
});

// 4. Reschedule Appointment
// PATCH /api/appointments/:id/reschedule
router.patch('/appointments/:id/reschedule', authorize(Role.PATIENT), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = rescheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { startTime, endTime } = parseResult.data;

    // Clean up expired holds
    await cleanupExpiredHolds();

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true } // doctor is already DoctorProfile
    });

    if (!appointment || !appointment.doctor) {
      return next(new AppError('Appointment record not found', 404));
    }

    // Verify patient owns it
    if (appointment.patient.userId !== req.user!.id) {
      return next(new AppError('Access denied, unauthorized operation', 403));
    }

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    // Verify doctor is not on leave on new date
    const checkDate = new Date(newStart);
    checkDate.setUTCHours(0, 0, 0, 0);

    const isLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: appointment.doctor.id,
        leaveDate: checkDate
      }
    });

    if (isLeave) {
      return next(new AppError('Doctor is on leave on this date', 400));
    }

    // Verify doctor working hours
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = weekdays[newStart.getUTCDay()];

    const availabilities = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: appointment.doctor.id,
        dayOfWeek: dayOfWeekName
      }
    });

    const startMin = newStart.getUTCHours() * 60 + newStart.getUTCMinutes();
    const endMin = newEnd.getUTCHours() * 60 + newEnd.getUTCMinutes();

    const isWorking = availabilities.some(avail => {
      const [aStartH, aStartM] = avail.startTime.split(':').map(Number);
      const [aEndH, aEndM] = avail.endTime.split(':').map(Number);
      const aStartMin = aStartH * 60 + aStartM;
      const aEndMin = aEndH * 60 + aEndM;
      return startMin >= aStartMin && endMin <= aEndMin;
    });

    if (!isWorking) {
      return next(new AppError('Doctor is not working during this time slot', 400));
    }

    // Verify slot is not occupied by another active appointment
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appointment.doctorId,
        startTime: newStart,
        status: { in: ['CONFIRMED', 'HELD'] }
      }
    });

    if (conflict) {
      return next(new AppError('This slot is already booked or held by another patient', 400));
    }

    try {
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          status: 'CONFIRMED' // Auto-confirms on reschedule
        }
      });

      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: updated
      });
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        return next(new AppError('This slot was just booked by another patient.', 400));
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
});

// 5. Get Patient Appointments
// GET /api/appointments/my
router.get('/appointments/my', authorize(Role.PATIENT), async (req: AuthRequest, res, next) => {
  try {
    // Clean expired holds so list is accurate
    await cleanupExpiredHolds();

    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!patientProfile) {
      return next(new AppError('Patient profile not found', 400));
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientProfile.id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        symptom: {
          select: {
            description: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Format cleaner for consumption
    const formatted = appointments.map(appt => ({
      id: appt.id,
      doctorId: appt.doctor.userId, // Return Doctor User ID for slots query
      doctorName: appt.doctor.user.name,
      specialization: appt.doctor.specialization,
      startTime: appt.startTime.toISOString(),
      endTime: appt.endTime.toISOString(),
      status: appt.status,
      holdExpiresAt: appt.holdExpiresAt?.toISOString() || null,
      symptoms: appt.symptom?.description || null
    }));

    res.status(200).json({
      success: true,
      appointments: formatted
    });
  } catch (err) {
    next(err);
  }
});

// 6. Get Doctor Appointments
// GET /api/appointments/doctor
router.get('/appointments/doctor', authorize(Role.DOCTOR), async (req: AuthRequest, res, next) => {
  try {
    // Clean expired holds so list is accurate
    await cleanupExpiredHolds();

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!doctorProfile) {
      return next(new AppError('Doctor profile not found', 400));
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id, // Query by DoctorProfile primary key ID
        status: { in: ['CONFIRMED', 'HELD', 'COMPLETED'] }
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        symptom: {
          select: {
            description: true
          }
        },
        aiSummary: true
      },
      orderBy: { startTime: 'asc' }
    });

    const formatted = appointments.map(appt => ({
      id: appt.id,
      patientName: appt.patient.user.name,
      patientEmail: appt.patient.user.email,
      startTime: appt.startTime.toISOString(),
      endTime: appt.endTime.toISOString(),
      status: appt.status,
      symptoms: appt.symptom?.description || null,
      aiSummary: appt.aiSummary ? {
        status: appt.aiSummary.status,
        urgency: appt.aiSummary.urgency,
        chiefComplaint: appt.aiSummary.chiefComplaint,
        suggestedQuestions: appt.aiSummary.suggestedQuestions
      } : null
    }));

    res.status(200).json({
      success: true,
      appointments: formatted
    });
  } catch (err) {
    next(err);
  }
});

// 7. Get AI Summary for appointment
// GET /api/appointments/:id/ai-summary
router.get('/appointments/:id/ai-summary', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        aiSummary: true
      }
    });

    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }

    // Role checks: must be the assigned doctor or an admin
    const isAdmin = req.user?.role === Role.ADMIN;
    const isAssignedDoctor = req.user?.role === Role.DOCTOR && appointment.doctor.userId === req.user.id;

    if (!isAdmin && !isAssignedDoctor) {
      return next(new AppError('Unauthorized: Access denied to AI pre-visit summary', 403));
    }

    if (!appointment.aiSummary) {
      return next(new AppError('AI summary not found for this appointment', 404));
    }

    res.status(200).json({
      success: true,
      aiSummary: appointment.aiSummary
    });
  } catch (err) {
    next(err);
  }
});

export default router;
