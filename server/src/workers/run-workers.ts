import './email.worker';
import './medication.worker';

console.log('========================================');
console.log('[Workers Runner] AegisHealth background workers started successfully.');
console.log('[Workers Runner] Listening to "email-queue" and "medication-queue"...');
console.log('========================================');

// Graceful shutdown
const grace = async (signal: string) => {
  console.log(`[Workers Runner] Received ${signal}. Shutting down workers...`);
  process.exit(0);
};

process.on('SIGINT', () => grace('SIGINT'));
process.on('SIGTERM', () => grace('SIGTERM'));
