import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  try {
    const sanitized = config.mongodbUri.replace(/:([^:@/]+)@/, ':****@');
    logger.info(`Connecting to MongoDB: ${sanitized}`);
    await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB connected successfully (db: ${mongoose.connection.name})`);
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}
