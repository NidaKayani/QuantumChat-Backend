import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.isDev ? 10_000 : config.rateLimit.max,
  skipSuccessfulRequests: true,
  skip: () => config.isDev && process.env.RATE_LIMIT_DEV !== 'true',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDev ? 200 : 20,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many authentication attempts' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Upload limit exceeded' },
});
