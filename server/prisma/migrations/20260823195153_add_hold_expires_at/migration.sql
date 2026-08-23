-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "holdExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Appointment_doctorId_startTime_idx" ON "Appointment"("doctorId", "startTime");

-- CreateUniqueIndex
CREATE UNIQUE INDEX unique_active_appointment ON "Appointment" ("doctorId", "startTime") WHERE status IN ('HELD', 'CONFIRMED');
