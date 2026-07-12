import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Website } from '../models';
import { config } from '../config';
import { logger } from '../config/logger';

const allowedOrigins = ['https://frontend.com', 'http://localhost:3000'];//change when deployed

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
});

const defaultOrigins = new Set(config.corsOrigins);

export const dynamicCors = cors({
  origin: async (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (defaultOrigins.has(origin) || config.isDev) {
      callback(null, true);
      return;
    }

    try {
      const website = await Website.findOne({
        isActive: true,
        $or: [{ domain: origin }, { domain: new URL(origin).hostname }],
      });

      if (website) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } catch {
      callback(new Error('CORS validation failed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Website-Id'],
});

export function validateWebsiteOrigin(req: Request, res: Response, next: NextFunction): void {
  const websiteId = req.headers['x-website-id'] as string;
  if (websiteId) {
    (req as Request & { websiteId?: string }).websiteId = websiteId;
  }
  next();
}
