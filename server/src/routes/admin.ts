import { Router } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validators
const createDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  specialization: z.string().min(2, 'Specialization must be at least 2 characters'),
  experience: z.number().int().nonnegative().optional().nullable(),
  slotDuration: z.number().int().positive('Slot duration must be positive')
});

const updateDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  specialization: z.string().min(2, 'Specialization must be at least 2 characters').optional(),
  experience: z.number().int().nonnegative().optional().nullable(),
  slotDuration: z.number().int().positive('Slot duration must be positive').optional(),
  isActive: z.boolean().optional()
});

const availabilitySchema = z.object({
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  return (endH * 60 + endM) > (startH * 60 + startM);
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

const leaveSchema = z.object({
  leaveDate: z.string().min(1, 'Leave date is required'),
  reason: z.string().optional().nullable()
});

// Protect all routes with admin check
router.use(authenticate);
router.use(authorize(Role.ADMIN));

// 1. Create doctor
// POST /api/admin/doctors
router.post('/doctors', async (req, res, next) => {
  try {
    const parseResult = createDoctorSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { name, email, password, specialization, experience, slotDuration } = parseResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User and DoctorProfile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            specialization,
            experience: experience || null,
            slotDuration,
            isActive: true
          }
        }
      },
      include: {
        doctorProfile: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      doctor: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorProfile: user.doctorProfile
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Get all doctors
// GET /api/admin/doctors
router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

    // Format output flatly/cleanly
    const formatted = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      specialization: doc.doctorProfile?.specialization || 'General',
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

// 3. Get doctor by ID
// GET /api/admin/doctors/:id
router.get('/doctors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorProfile: {
          include: {
            availabilities: true,
            leaves: true
          }
        }
      }
    });

    if (!doctor) {
      return next(new AppError('Doctor not found', 404));
    }

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.doctorProfile?.specialization,
        experience: doctor.doctorProfile?.experience,
        slotDuration: doctor.doctorProfile?.slotDuration,
        isActive: doctor.doctorProfile?.isActive,
        doctorProfileId: doctor.doctorProfile?.id,
        availabilities: doctor.doctorProfile?.availabilities || [],
        leaves: doctor.doctorProfile?.leaves || []
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. Update doctor
// PATCH /api/admin/doctors/:id
router.patch('/doctors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = updateDoctorSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { name, specialization, experience, slotDuration, isActive } = parseResult.data;

    // Check if user exists and is a doctor
    const existingDoctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: true }
    });

    if (!existingDoctor || !existingDoctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    // Update
    await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        doctorProfile: {
          update: {
            ...(specialization && { specialization }),
            ...(experience !== undefined && { experience }),
            ...(slotDuration && { slotDuration }),
            ...(isActive !== undefined && { isActive })
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

// 5. Working Hours (Availability)
// GET /api/admin/doctors/:id/availability
router.get('/doctors/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: { include: { availabilities: true } } }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    res.status(200).json({
      success: true,
      availabilities: doctor.doctorProfile.availabilities
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/doctors/:id/availability
router.post('/doctors/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = availabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { dayOfWeek, startTime, endTime } = parseResult.data;

    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    const availability = await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.doctorProfile.id,
        dayOfWeek,
        startTime,
        endTime
      }
    });

    res.status(201).json({
      success: true,
      message: 'Availability schedule added successfully',
      availability
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/doctors/:id/availability/:availabilityId
router.delete('/doctors/:id/availability/:availabilityId', async (req, res, next) => {
  try {
    const { id, availabilityId } = req.params;

    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    // Verify it belongs to the doctor
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability || availability.doctorId !== doctor.doctorProfile.id) {
      return next(new AppError('Availability slot not found', 404));
    }

    await prisma.doctorAvailability.delete({
      where: { id: availabilityId }
    });

    res.status(200).json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

// 6. Doctor Leave
// GET /api/admin/doctors/:id/leaves
router.get('/doctors/:id/leaves', async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: { include: { leaves: true } } }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    res.status(200).json({
      success: true,
      leaves: doctor.doctorProfile.leaves
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/doctors/:id/leaves
router.post('/doctors/:id/leaves', async (req, res, next) => {
  try {
    const { id } = req.params;
    const parseResult = leaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(issue => issue.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }

    const { leaveDate, reason } = parseResult.data;

    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    // Normalize date to start of day
    const normalizedDate = new Date(leaveDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Prevent duplicate leave date for this doctor
    const existingLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id,
        leaveDate: normalizedDate
      }
    });

    if (existingLeave) {
      return next(new AppError('Doctor is already on leave on this date', 400));
    }

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: doctor.doctorProfile.id,
        leaveDate: normalizedDate,
        reason: reason || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Leave day added successfully',
      leave
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/doctors/:id/leaves/:leaveId
router.delete('/doctors/:id/leaves/:leaveId', async (req, res, next) => {
  try {
    const { id, leaveId } = req.params;

    const doctor = await prisma.user.findFirst({
      where: { id, role: Role.DOCTOR },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return next(new AppError('Doctor profile not found', 404));
    }

    const leave = await prisma.doctorLeave.findUnique({
      where: { id: leaveId }
    });

    if (!leave || leave.doctorId !== doctor.doctorProfile.id) {
      return next(new AppError('Leave record not found', 404));
    }

    await prisma.doctorLeave.delete({
      where: { id: leaveId }
    });

    res.status(200).json({
      success: true,
      message: 'Leave date deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
