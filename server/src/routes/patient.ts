import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { cleanupExpiredHolds } from '../utils/hold';

const router = Router();
const prisma = new PrismaClient();

// Validators
const searchSchema = z.object({
  specialization: z.string().optional()
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

// Protect all patient routes
router.use(authenticate);

// 1. Patient Doctor Search
// GET /api/doctors?specialization=Cardiology
router.get('/doctors', async (req, res, next) => {
  try {
    const parseResult = searchSchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { specialization } = parseResult.data;

    const doctors = await prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        doctorProfile: {
          isActive: true,
          ...(specialization && {
            specialization: {
              contains: specialization,
              mode: 'insensitive'
            }
          })
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        doctorProfile: {
          select: {
            id: true,
            specialization: true,
            experience: true,
            slotDuration: true,
            isActive: true
          }
        }
      }
    });

    const formatted = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      specialization: doc.doctorProfile?.specialization || 'General Practice',
      experience: doc.doctorProfile?.experience || 0,
      slotDuration: doc.doctorProfile?.slotDuration || 30,
      isActive: doc.doctorProfile?.isActive ?? true,
      doctorProfileId: doc.doctorProfile?.id
    }));

    res.status(200).json({
      success: true,
      doctors: formatted
    });
  } catch (err) {
    next(err);
  }
});

// 2. Get Doctor details (for patients)
// GET /api/doctors/:id
router.get('/doctors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: Role.DOCTOR,
        doctorProfile: { isActive: true }
      },
      select: {
        id: true,
        name: true,
        email: true,
        doctorProfile: {
          include: {
            availabilities: true,
            leaves: true
          }
        }
      }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Active doctor profile not found', 404));
    }

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.doctorProfile.specialization,
        experience: doctor.doctorProfile.experience,
        slotDuration: doctor.doctorProfile.slotDuration,
        availabilities: doctor.doctorProfile.availabilities,
        leaves: doctor.doctorProfile.leaves
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. Dynamic Slots Generator
// GET /api/doctors/:id/slots?date=YYYY-MM-DD
router.get('/doctors/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const parseResult = slotsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { date } = parseResult.data;

    // Clean up any expired slots holds first
    await cleanupExpiredHolds();

    // Verify doctor exists and is active
    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: Role.DOCTOR,
        doctorProfile: { isActive: true }
      },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Active doctor profile not found', 404));
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // 1. Respect doctor leave
    const isLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id,
        leaveDate: targetDate
      }
    });

    if (isLeave) {
      return res.status(200).json({
        success: true,
        date,
        doctorId: id,
        slots: []
      });
    }

    // 2. Map weekdays to check working hours
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = weekdays[targetDate.getUTCDay()];

    const availabilities = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctor.doctorProfile.id,
        dayOfWeek: dayOfWeekName
      }
    });

    // 3. Fetch active appointments (HELD/CONFIRMED) for the doctor on this date
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.doctorProfile.id,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['CONFIRMED', 'HELD']
        }
      }
    });

    const slots: Array<{ startTime: string; endTime: string; status: 'AVAILABLE' | 'HELD' | 'BOOKED' }> = [];
    const slotDuration = doctor.doctorProfile.slotDuration;

    // 4. Generate slots based on availability intervals
    for (const avail of availabilities) {
      const [startH, startM] = avail.startTime.split(':').map(Number);
      const [endH, endM] = avail.endTime.split(':').map(Number);

      let currentMin = startH * 60 + startM;
      const limitMin = endH * 60 + endM;

      while (currentMin + slotDuration <= limitMin) {
        const slotStartHour = Math.floor(currentMin / 60);
        const slotStartMin = currentMin % 60;
        
        const slotEndHour = Math.floor((currentMin + slotDuration) / 60);
        const slotEndMin = (currentMin + slotDuration) % 60;

        const pad = (n: number) => String(n).padStart(2, '0');
        const slotStartStr = `${pad(slotStartHour)}:${pad(slotStartMin)}`;
        const slotEndStr = `${pad(slotEndHour)}:${pad(slotEndMin)}`;

        // Date strings in ISO Format
        const slotStart = new Date(`${date}T${slotStartStr}:00.000Z`);
        const slotEnd = new Date(`${date}T${slotEndStr}:00.000Z`);

        let status: 'AVAILABLE' | 'HELD' | 'BOOKED' = 'AVAILABLE';

        // Check if slot has already passed
        const now = new Date();
        if (slotStart < now) {
          status = 'BOOKED';
        } else {
          // Check for appointment overlap
          const match = appointments.find(
            appt => appt.startTime.getTime() === slotStart.getTime()
          );

          if (match) {
            if (match.status === 'CONFIRMED') {
              status = 'BOOKED';
            } else if (match.status === 'HELD') {
              status = 'HELD';
            }
          }
        }

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          status
        });

        currentMin += slotDuration;
      }
    }

    // Sort slots chronologically
    slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    res.status(200).json({
      success: true,
      date,
      doctorId: id,
      slots
    });
  } catch (err) {
    next(err);
  }
});

export default router;
