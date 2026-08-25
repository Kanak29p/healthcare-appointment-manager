# AegisHealth: Healthcare Appointment & Follow-up Manager

AegisHealth is a healthcare scheduling and patient management web application. It automates appointment slots booking, handles real-time holds, uses Gemini AI for pre-visit symptom analysis, clinical observations recording, and post-visit summaries, and schedules background jobs for medication notifications.

---

## 1. Redis Requirement
AegisHealth uses **Redis** as a fast, in-memory data store to manage background queues via **BullMQ**. It is required for scheduling medication reminders and delivering async email notifications without slowing down client request-response cycles.

---

## 2. Environment Variables

Configure the following variables in `server/.env` (use `server/.env.example` as a template):

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/healthcare_db?schema=public"

# Authentication Security
JWT_SECRET="your_jwt_secret_key_here"
PORT=5000
CLIENT_URL="http://localhost:5173"

# Gemini LLM Service API Key
GEMINI_API_KEY="your_gemini_key_here"
SIMULATE_LLM_SUCCESS="true"
SIMULATE_LLM_FAILURE="false"

# Redis Config (Required for BullMQ)
REDIS_URL="redis://127.0.0.1:6379"

# Email SMTP Config
EMAIL_HOST=""
EMAIL_PORT="587"
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_FROM="noreply@aegishealth.com"
```

---

## 3. How to Start Redis Locally

- **Using Docker (Recommended):**
  ```bash
  docker run -d --name aegis-redis -p 6379:6379 redis:alpine
  ```
- **Using Native Service (Windows/Linux/macOS):**
  Start your Redis server using `redis-server` command.

---

## 4. How to Start API Server
Run the following inside the root directory to boot the API backend server:
```bash
npm run dev:server
```
Alternatively, in the `server/` directory:
```bash
npm run dev
```

---

## 5. How to Start Background Workers
Run the following inside the root directory to boot the BullMQ queue workers (processes both email notifications and medication reminders):
```bash
npm run worker
```
Alternatively, in the `server/` directory:
```bash
npm run worker
```

To run everything concurrently (API + Client Web Interface + Workers) in development:
```bash
npm run dev:all
```

---

## 6. Development Email Mode (Safe Mock Logging)
If `EMAIL_HOST` is left blank in the `.env` configuration:
- The system enters a safe **development logging mode**.
- Emails are not sent to any SMTP servers.
- The recipient, subject, and email body are outputted directly to the backend terminal logs instead.
- The BullMQ worker marks the job as completed successfully, ensuring end-to-end flows remain testable locally.

---

## 7. How Email Retry Works
- The email worker uses BullMQ's automatic retry configuration.
- If a delivery attempt fails (due to SMTP network/auth failures), the job is retried automatically up to **3 times**.
- It uses **exponential backoff** (starting at a delay of `5000ms`) to space out the retry attempts.
- If all 3 attempts fail, the job is marked as permanently failed in Redis so it can be inspected via the failed jobs list.
- An email delivery failure will **never** crash the worker or fail the client API request (e.g. booking or completing appointments remains fully successful).

---

## 8. How Medication Reminder Scheduling Works
- When a doctor completes a consultation with an active prescription, medication reminder jobs are created.
- The medication's `duration` string is parsed to compute the target number of days (e.g. "3 days" => 3 days).
- Standard frequencies are mapped to daily UTC reminder slots:
  - `ONCE_DAILY`: `09:00`
  - `TWICE_DAILY`: `09:00`, `21:00`
  - `THREE_TIMES_DAILY`: `09:00`, `15:00`, `21:00`
  - `AS_NEEDED`: No automatic schedules.
- **Duplicate Reminder Protection:** To prevent duplicate reminders if a prescription is saved/completed twice, each job is assigned a deterministic ID:
  `medication-{medicationId}-{YYYY-MM-DD}-{HH-mm}`. If the job ID already exists in Redis, BullMQ will ignore the duplicate request.

---

## 9. Timezone Assumption
AegisHealth assumes **UTC** as the baseline application timezone for slot holds, appointment dates, leaves, and medication scheduling. This ensures that date-time conversions do not shift or cause drift across different clients and server environments.

---

## 10. Google Calendar OAuth 2.0 Integration Setup

AegisHealth supports syncing medical checkups directly to patients' and doctors' primary Google Calendars using the Google Calendar API and OAuth 2.0.

### Google Cloud Console Configuration Steps
1. **Google Cloud Project Creation:** Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).
2. **Enable Calendar API:** Navigate to the API Library and enable the **Google Calendar API** for your project.
3. **OAuth Consent Screen:**
   - Go to OAuth Consent Screen, select **External** user type.
   - Fill in app name (`AegisHealth`), support email, and developer contact.
   - Add scope: `https://www.googleapis.com/auth/calendar.events` (used to insert, update, and delete events).
   - Add your test Google accounts under "Test users".
4. **OAuth Web Client ID Setup:**
   - Go to Credentials, click **Create Credentials** -> **OAuth client ID**.
   - Select application type **Web application**.
   - Add **Authorized Redirect URIs**:
     `http://localhost:5000/api/google-calendar/callback`
   - Download the generated Client ID and Client Secret.

### Environment Variables
Configure the following keys in `server/.env`:
```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/google-calendar/callback"
```

### Calendar Connection Behavior
- **How to Connect:** Logged-in patients and doctors will see a **Google Calendar** settings card on their respective dashboards. Clicking `[Connect Google Calendar]` redirects to Google's consent screen. After authorization, the connection status is displayed, and access tokens are refreshed automatically behind the scenes using the stored refresh token.
- **Calendar Event Sync Details:**
  - **Booking/Confirm:** A calendar event is created on the primary calendar of the patient and/or doctor (if connected).
  - **Event Contents:** Contains Dr. Name, Specialization, Patient Name, Status, and AegisHealth Appointment ID. It **never** contains symptoms, diagnoses, or clinical notes.
  - **Reschedule:** Modifies the existing calendar event details (start, end, description) instead of creating duplicates.
  - **Cancellation:** Deletes the event on Google Calendar.
- **Graceful Failure Handling:**
  - If Google APIs are unavailable, or credentials are not configured, the operations fail/log silently.
  - **Calendar failures never block booking, rescheduling, or cancellation** flow in the AegisHealth portal; checkups remain fully successful, and raw Google API errors are never exposed to patients.
