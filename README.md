# 🏥 AegisHealth — Healthcare Appointment Manager

AegisHealth is a full-stack healthcare appointment and follow-up management platform that connects **patients, doctors, and administrators** in one system.

It provides appointment scheduling, doctor availability management, AI-powered pre-visit and post-visit summaries, prescriptions, email notifications, Google Calendar integration, and background job processing.

---
✨ Features

👤 Patient

* Register and login
* Search doctors by specialization
* View available appointment slots
* Book, cancel, and reschedule appointments
* Submit symptoms before an appointment
* View prescriptions and post-visit summaries
* Receive appointment and medication reminders

👨‍⚕️ Doctor

* Doctor dashboard
* View upcoming appointments
* View patient symptoms
* View AI-generated pre-visit summary
* Add consultation notes
* Create prescriptions
* Generate patient-friendly post-visit summaries

👨‍💼 Admin

* Create and manage doctors
* Configure specialization
* Configure working hours
* Set appointment slot duration
* Manage doctor leave
* Monitor failed background jobs

---
🤖 AI Features

Pre-Visit Summary

Patient symptoms are analyzed using Gemini to generate:

* **Urgency level** — Low / Medium / High
* **Chief complaint**
* **Three suggested questions for the doctor**

The summary is available to the **assigned doctor** before the appointment.

Post-Visit Summary

After the consultation, the doctor's notes and prescription are processed by the LLM to generate a simple, patient-friendly summary containing:

* Consultation summary
* Medication schedule
* Follow-up instructions

---

📅 Appointment Management

The appointment system supports:

* Doctor availability
* Slot generation
* Temporary slot holding
* Double-booking prevention
* Appointment confirmation
* Cancellation
* Rescheduling
* Doctor leave handling

---

🔔 Notifications & Background Jobs

The application uses background workers for asynchronous tasks such as:

* Appointment confirmation emails
* Appointment reminders
* Cancellation notifications
* Doctor leave notifications
* Medication reminders
* Email retries
* AI retries
* Calendar retries

Failed jobs can be monitored from the Admin Dashboard.

---

🗓️ Google Calendar

Appointments can be synchronized with Google Calendar using OAuth 2.0.

* Create calendar events on booking
* Update events on rescheduling
* Remove events on cancellation

---

🛠️ Tech Stack

**Frontend**

* React
* Vite
* TypeScript

**Backend**

* Node.js
* Express
* TypeScript

**Database**

* PostgreSQL
* Prisma ORM

**AI**

* Google Gemini API

**Background Jobs**

* Redis
* BullMQ

**Other**

* JWT Authentication
* Google Calendar API
* Email Service

---

📁 Project Structure

```text
healthcare-appointment-manager/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
│
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── jobs/
│       └── middleware/
│
├── .gitignore
└── README.md
```

🔐 Security & Reliability

* JWT-based authentication
* Role-based access control
* Protected doctor/admin APIs
* Server-side appointment validation
* Double-booking protection
* Secure environment variables
* AI failure handling
* Background job retries
* Failed-job monitoring
* Sensitive provider errors are not exposed to users

If the AI service fails, the **appointment is not cancelled**. The failure is stored and the doctor can still access the patient's original symptoms.

---

📌 Application Flow

```text
Patient
   ↓
Search Doctor
   ↓
Select Slot
   ↓
Enter Symptoms
   ↓
Book Appointment
   ↓
AI Pre-Visit Summary
   ↓
Doctor Consultation
   ↓
Prescription + Notes
   ↓
AI Post-Visit Summary
   ↓
Patient Follow-up
```

---

📄 License

Developed as a full-stack healthcare appointment and follow-up management project.
