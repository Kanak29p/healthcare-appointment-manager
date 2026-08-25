import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class GoogleCalendarService {
  private clientId = process.env.GOOGLE_CLIENT_ID;
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  private redirectUri = process.env.GOOGLE_REDIRECT_URI;
  private enabled = false;

  constructor() {
    if (this.clientId && this.clientSecret && this.redirectUri) {
      this.enabled = true;
      console.log('[GoogleCalendarService] Initialized with Google client credentials.');
    } else {
      console.warn('[GoogleCalendarService] Google client credentials missing. Running in fallback/disabled mode.');
    }
  }

  private getClient() {
    if (!this.enabled) {
      throw new Error('Google OAuth client credentials are not configured.');
    }
    return new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  public getAuthUrl(state: string): string {
    if (!this.enabled) {
      return '';
    }
    const oauth2Client = this.getClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force Google to provide a refresh token
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state
    });
  }

  public async exchangeCodeForTokens(code: string): Promise<{ refresh_token: string; email: string | null }> {
    if (!this.enabled) {
      throw new Error('Google OAuth is disabled due to missing credentials.');
    }
    const oauth2Client = this.getClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      throw new Error('Refresh token not received. Please revoke access from Google Account Settings and retry.');
    }

    // Try to get user email from the token payload (id_token) if possible
    let email: string | null = null;
    if (tokens.id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: this.clientId
        });
        const payload = ticket.getPayload();
        email = payload?.email || null;
      } catch (err: any) {
        console.warn('[GoogleCalendarService] Failed to parse id_token email:', err.message);
      }
    }

    return {
      refresh_token: tokens.refresh_token,
      email
    };
  }

  private async getAuthenticatedClient(userId: string) {
    if (!this.enabled) {
      return null;
    }

    const connection = await prisma.googleCalendarConnection.findUnique({
      where: { userId }
    });

    if (!connection || !connection.refreshToken) {
      return null;
    }

    const oauth2Client = this.getClient();
    oauth2Client.setCredentials({
      refresh_token: connection.refreshToken
    });

    // Check / refresh access token when credentials are set
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Update refresh token if Google rolls it
        await prisma.googleCalendarConnection.update({
          where: { userId },
          data: { refreshToken: tokens.refresh_token }
        });
      }
    });

    return oauth2Client;
  }

  /**
   * Safe wrapper that handles invalid/revoked refresh tokens by disconnecting the user calendar
   */
  private async handleOAuthError(userId: string, err: any) {
    console.error(`[GoogleCalendarService] OAuth connection error for user: ${userId}. Error:`, err.message || err);
    
    // Check if error is related to invalid credentials or revoked access (e.g. 400 invalid_grant)
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('invalid_grant') || errMsg.includes('credentials') || err.code === 400 || err.code === 401) {
      console.warn(`[GoogleCalendarService] Refresh token is invalid/expired. Disconnecting user ${userId} Google Calendar connection...`);
      await prisma.googleCalendarConnection.delete({
        where: { userId }
      }).catch((dbErr) => console.error('[GoogleCalendarService] Failed to delete invalid connection:', dbErr));
    }
  }

  public async createEvent(
    userId: string,
    apptDetails: { appointmentId: string; summary: string; description: string; startTime: Date; endTime: Date }
  ): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const authClient = await this.getAuthenticatedClient(userId);
      if (!authClient) {
        console.log(`[GoogleCalendarService] User ${userId} has not connected Google Calendar. Skipping event creation.`);
        return false;
      }

      const calendar = google.calendar({ version: 'v3', auth: authClient });
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: apptDetails.summary,
          description: apptDetails.description,
          start: {
            dateTime: apptDetails.startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: apptDetails.endTime.toISOString(),
            timeZone: 'UTC'
          }
        }
      });

      const googleEventId = response.data.id;
      if (!googleEventId) {
        throw new Error('Google Calendar response did not return an Event ID.');
      }

      // Save tracking record in database
      await prisma.appointmentCalendarEvent.upsert({
        where: {
          appointmentId_userId: {
            appointmentId: apptDetails.appointmentId,
            userId
          }
        },
        update: {
          googleEventId,
          calendarId: 'primary'
        },
        create: {
          appointmentId: apptDetails.appointmentId,
          userId,
          googleEventId,
          calendarId: 'primary'
        }
      });

      console.log(`[GoogleCalendarService] Successfully created calendar event for user ${userId} (eventId: ${googleEventId})`);
      return true;
    } catch (err: any) {
      await this.handleOAuthError(userId, err);
      return false;
    }
  }

  public async updateEvent(
    userId: string,
    appointmentId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const authClient = await this.getAuthenticatedClient(userId);
      if (!authClient) {
        return false;
      }

      // Check if event tracking record exists
      const eventRecord = await prisma.appointmentCalendarEvent.findUnique({
        where: {
          appointmentId_userId: {
            appointmentId,
            userId
          }
        }
      });

      if (!eventRecord) {
        console.log(`[GoogleCalendarService] No calendar event tracking record found for appt ${appointmentId} / user ${userId}. Skipping update.`);
        return false;
      }

      const calendar = google.calendar({ version: 'v3', auth: authClient });

      // Get existing event details to preserve summary/description
      const existingEvent = await calendar.events.get({
        calendarId: eventRecord.calendarId,
        eventId: eventRecord.googleEventId
      });

      await calendar.events.update({
        calendarId: eventRecord.calendarId,
        eventId: eventRecord.googleEventId,
        requestBody: {
          summary: existingEvent.data.summary || 'Medical Appointment',
          description: existingEvent.data.description || '',
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
          }
        }
      });

      console.log(`[GoogleCalendarService] Successfully updated calendar event ${eventRecord.googleEventId} for user ${userId}`);
      return true;
    } catch (err: any) {
      await this.handleOAuthError(userId, err);
      return false;
    }
  }

  public async deleteEvent(userId: string, appointmentId: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const authClient = await this.getAuthenticatedClient(userId);
      if (!authClient) {
        return false;
      }

      const eventRecord = await prisma.appointmentCalendarEvent.findUnique({
        where: {
          appointmentId_userId: {
            appointmentId,
            userId
          }
        }
      });

      if (!eventRecord) {
        return false;
      }

      const calendar = google.calendar({ version: 'v3', auth: authClient });
      
      // Delete the event on Google Calendar
      try {
        await calendar.events.delete({
          calendarId: eventRecord.calendarId,
          eventId: eventRecord.googleEventId
        });
      } catch (apiErr: any) {
        // If it's already deleted (410 Gone / 404 Not Found), treat it as successfully completed
        if (apiErr.code !== 410 && apiErr.code !== 404) {
          throw apiErr;
        }
        console.log(`[GoogleCalendarService] Event was already deleted from Google Calendar.`);
      }

      // Remove from database
      await prisma.appointmentCalendarEvent.delete({
        where: {
          appointmentId_userId: {
            appointmentId,
            userId
          }
        }
      });

      console.log(`[GoogleCalendarService] Successfully deleted event record for user ${userId} / appt ${appointmentId}`);
      return true;
    } catch (err: any) {
      await this.handleOAuthError(userId, err);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
