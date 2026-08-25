import nodemailer from 'nodemailer';

export interface ConfirmationEmailData {
  email: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export interface CancellationEmailData {
  email: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export interface RescheduledEmailData {
  email: string;
  patientName: string;
  doctorName: string;
  oldDate: string;
  newDate: string;
  status: string;
}

export interface DoctorLeaveEmailData {
  email: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  reason: string;
}

export interface MedicationReminderEmailData {
  email: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  instruction: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private devMode = false;
  private fromAddress = 'noreply@aegishealth.com';

  constructor() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM;

    if (from) {
      this.fromAddress = from;
    }

    if (!host) {
      console.log('[EmailService] EMAIL_HOST not configured. Running in safe development logging mode.');
      this.devMode = true;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined
      });
    }
  }

  private async sendMail(to: string, subject: string, text: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.devMode) {
      console.log('========================================');
      console.log(`[DEVELOPMENT EMAIL MOCK]`);
      console.log(`TO:      ${to}`);
      console.log(`FROM:    ${this.fromAddress}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:`);
      console.log(text);
      console.log('========================================');
      return { success: true, messageId: 'dev-mode-mock-id' };
    }

    try {
      if (!this.transporter) {
        throw new Error('Transporter not initialized.');
      }

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html
      });

      console.log(`[EmailService] Email sent successfully. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error.message || error);
      return { success: false, error: error.message || 'Unknown SMTP error' };
    }
  }

  public async sendAppointmentConfirmationEmail(data: ConfirmationEmailData) {
    const subject = `Appointment Confirmed - AegisHealth`;
    const text = `Dear ${data.patientName},\n\nYour appointment with ${data.doctorName} has been successfully confirmed.\n\nDetails:\nDate: ${data.appointmentDate}\nTime: ${data.appointmentTime} (UTC)\nStatus: ${data.status}\n\nThank you for choosing AegisHealth.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5;">AegisHealth Appointment Confirmed</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your appointment with <strong>${data.doctorName}</strong> has been successfully confirmed.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p><strong>Date:</strong> ${data.appointmentDate}</p>
        <p><strong>Time:</strong> ${data.appointmentTime} (UTC)</p>
        <p><strong>Status:</strong> <span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; font-size: 0.875rem; font-weight: bold;">${data.status}</span></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p style="font-size: 0.875rem; color: #64748b;">Please arrive 10 minutes prior to your scheduled time. If you need to reschedule or cancel, please do so via the patient portal at least 2 hours in advance.</p>
      </div>
    `;
    return this.sendMail(data.email, subject, text, html);
  }

  public async sendAppointmentCancellationEmail(data: CancellationEmailData) {
    const subject = `Appointment Cancelled - AegisHealth`;
    const text = `Dear ${data.patientName},\n\nYour appointment with ${data.doctorName} scheduled on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.\n\nStatus: ${data.status}\n\nIf you have any questions or would like to book another appointment, please log in to AegisHealth.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #e11d48;">AegisHealth Appointment Cancelled</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your appointment with <strong>${data.doctorName}</strong> scheduled on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p><strong>Status:</strong> <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 0.875rem; font-weight: bold;">${data.status}</span></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p style="font-size: 0.875rem; color: #64748b;">To schedule a new appointment, please log in to the AegisHealth patient dashboard.</p>
      </div>
    `;
    return this.sendMail(data.email, subject, text, html);
  }

  public async sendAppointmentRescheduledEmail(data: RescheduledEmailData) {
    const subject = `Appointment Rescheduled - AegisHealth`;
    const text = `Dear ${data.patientName},\n\nYour appointment with ${data.doctorName} has been rescheduled.\n\nOriginal Date/Time: ${data.oldDate}\nNew Date/Time: ${data.newDate} (UTC)\nStatus: ${data.status}\n\nPlease check the dashboard for details.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #d97706;">AegisHealth Appointment Rescheduled</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your appointment with <strong>${data.doctorName}</strong> has been successfully rescheduled.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p><strong>Original Schedule:</strong> <span style="text-decoration: line-through; color: #64748b;">${data.oldDate}</span></p>
        <p><strong>New Schedule:</strong> <strong>${data.newDate}</strong> (UTC)</p>
        <p><strong>Status:</strong> <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 0.875rem; font-weight: bold;">${data.status}</span></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p style="font-size: 0.875rem; color: #64748b;">Please review your dashboard for any additional pre-visit questions or symptoms log updates.</p>
      </div>
    `;
    return this.sendMail(data.email, subject, text, html);
  }

  public async sendDoctorLeaveEmail(data: DoctorLeaveEmailData) {
    const subject = `Urgent: Provider Schedule Update - AegisHealth`;
    const text = `Dear ${data.patientName},\n\nWe regret to inform you that ${data.doctorName} will be unavailable on ${data.appointmentDate} due to leave (${data.reason}).\n\nConsequently, your appointment has been cancelled.\n\nNext Action: Please log in to the AegisHealth portal to reschedule your consultation with ${data.doctorName} or book with another practitioner. We apologize for any inconvenience.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #dc2626;">Urgent Schedule Update from AegisHealth</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>We regret to inform you that <strong>${data.doctorName}</strong> will be unavailable on <strong>${data.appointmentDate}</strong> due to scheduled leave (Reason: <em>${data.reason}</em>).</p>
        <p>Consequently, your appointment on that date has been <strong>cancelled</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p><strong>Next Steps:</strong> Please log in to the AegisHealth portal to reschedule your consultation or select another practitioner.</p>
        <p style="font-size: 0.875rem; color: #64748b;">We sincerely apologize for any inconvenience this may cause to your health management timeline.</p>
      </div>
    `;
    return this.sendMail(data.email, subject, text, html);
  }

  public async sendMedicationReminderEmail(data: MedicationReminderEmailData) {
    const subject = `Medication Reminder: ${data.medicineName} - AegisHealth`;
    const text = `Dear ${data.patientName},\n\nThis is a friendly reminder to take your prescribed medication:\n\nMedication: ${data.medicineName}\nDosage: ${data.dosage}\nInstructions: ${data.instruction || 'Take as directed by your physician'}\n\nStay healthy!\n- AegisHealth Care Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #fafafa;">
        <div style="background-color: #6366f1; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; font-size: 1.25rem;">Medication Reminder</h2>
        </div>
        <div style="padding: 20px 10px;">
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>It is time to take your medication according to your prescription plan.</p>
          <div style="background-color: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Medicine:</strong> ${data.medicineName}</p>
            <p style="margin: 5px 0;"><strong>Dosage:</strong> ${data.dosage}</p>
            <p style="margin: 5px 0; color: #4f46e5;"><strong>Directions:</strong> ${data.instruction || 'Take as directed by your physician'}</p>
          </div>
          <p style="font-size: 0.875rem; color: #64748b; margin-top: 20px;">If you experience any unusual symptoms or side effects, please contact your primary doctor immediately.</p>
        </div>
      </div>
    `;
    return this.sendMail(data.email, subject, text, html);
  }
}

export const emailService = new EmailService();
