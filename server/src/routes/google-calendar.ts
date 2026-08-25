import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { googleCalendarService } from '../services/google-calendar.service';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-long-random-secret';

// 1. GET /api/google-calendar/connect
// Returns the Google OAuth consent screen authorization URL
router.get('/google-calendar/connect', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Generate secure state payload containing userId and role
    const statePayload = {
      userId: req.user!.id,
      role: req.user!.role,
      issuedAt: Date.now()
    };

    // Sign state using JWT_SECRET with a short 10-minute expiry
    const stateToken = jwt.sign(statePayload, JWT_SECRET, { expiresIn: '10m' });

    // Generate Google OAuth URL with state
    const authUrl = googleCalendarService.getAuthUrl(stateToken);

    if (!authUrl) {
      return next(new AppError('Google Calendar OAuth integration is not configured on the server.', 501));
    }

    res.status(200).json({
      success: true,
      url: authUrl
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/google-calendar/callback
// Handles callback redirected from Google consent screen
router.get('/google-calendar/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.warn('[GoogleCalendarCallback] Google OAuth returned error:', error);
      // Redirect back with error query param
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/patient/doctors?calendar_error=${error}`);
    }

    if (!code || !state) {
      return next(new AppError('Missing OAuth callback code or state', 400));
    }

    // Verify the state token (OAuth Callback State Validation / CSRF protection)
    let decodedState: any;
    try {
      decodedState = jwt.verify(state as string, JWT_SECRET);
    } catch (jwtErr) {
      console.error('[GoogleCalendarCallback] State validation failed:', jwtErr);
      return next(new AppError('State validation failed. Request may be tampered or expired.', 400));
    }

    const { userId, role } = decodedState;

    // Exchange auth code for tokens
    const { refresh_token, email } = await googleCalendarService.exchangeCodeForTokens(code as string);

    // Save refresh token securely in GoogleCalendarConnection table
    await prisma.googleCalendarConnection.upsert({
      where: { userId },
      update: {
        refreshToken: refresh_token,
        googleEmail: email || null
      },
      create: {
        userId,
        refreshToken: refresh_token,
        googleEmail: email || null
      }
    });

    console.log(`[GoogleCalendarCallback] User ${userId} successfully connected Google Calendar.`);

    // Redirect to correct dashboard page depending on their role
    const redirectUrl = role === Role.DOCTOR 
      ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/doctor/dashboard?calendar_connected=true`
      : `${process.env.CLIENT_URL || 'http://localhost:5173'}/patient/appointments?calendar_connected=true`;

    res.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[GoogleCalendarCallback] Error during exchange callback:', err.message || err);
    // Redirect back to landing/portal with generic error indicator
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/patient/doctors?calendar_error=exchange_failed`);
  }
});

// 3. GET /api/google-calendar/status
// Returns the calendar connection status of the logged-in user
router.get('/google-calendar/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const connection = await prisma.googleCalendarConnection.findUnique({
      where: { userId: req.user!.id }
    });

    res.status(200).json({
      success: true,
      connected: !!connection,
      googleEmail: connection?.googleEmail || null
    });
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/google-calendar/disconnect
// Removes the user's Google Calendar connection
router.post('/google-calendar/disconnect', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Find and delete the connection
    const connection = await prisma.googleCalendarConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return next(new AppError('No active Google Calendar connection found to disconnect.', 404));
    }

    // Delete associated calendar event records tracking (optional helper)
    await prisma.appointmentCalendarEvent.deleteMany({
      where: { userId }
    }).catch(() => {});

    await prisma.googleCalendarConnection.delete({
      where: { userId }
    });

    console.log(`[GoogleCalendarService] User ${userId} disconnected Google Calendar.`);

    res.status(200).json({
      success: true,
      message: 'Google Calendar connection disconnected successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
