import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import patientRouter from './routes/patient';
import appointmentRouter from './routes/appointment';
import doctorRouter from './routes/doctor';
import googleCalendarRouter from './routes/google-calendar';
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare Appointment Manager API is running'
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', patientRouter);
app.use('/api', appointmentRouter);
app.use('/api', doctorRouter);
app.use('/api', googleCalendarRouter);

// Fallback for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Healthcare Appointment Manager API is running on port ${PORT}`);
  console.log(`[Server] CORS enabled for origin: ${CLIENT_URL}`);
});
