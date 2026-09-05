import 'dotenv/config';
import http from 'http';
// Triggering dev reload
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initializeSocket } from './src/socket/index.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to database and start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`🚀 BEG-IMS Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.stack || err);
  process.exit(1);
});
