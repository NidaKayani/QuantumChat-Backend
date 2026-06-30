import express from 'express';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { dynamicCors, validateWebsiteOrigin } from './middleware/cors';
import { apiLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { initSocketIO } from './socket';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = express();
  const server = http.createServer(app);

  initSocketIO(server);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(morgan(config.isDev ? 'dev' : 'combined'));
  app.use(dynamicCors);
  app.use(validateWebsiteOrigin);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.resolve(config.uploadDir)));

  const widgetDist = path.resolve(__dirname, '../../frontend/widget/dist');
  const sdkDist = path.resolve(__dirname, '../../frontend/sdk/dist');
  app.use('/widget', express.static(widgetDist, { maxAge: config.isDev ? 0 : '1d' }));
  app.use('/sdk', express.static(sdkDist, { maxAge: config.isDev ? 0 : '1d' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'quantum-chat', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', apiLimiter, routes);
  app.use(notFound);
  app.use(errorHandler);

  server.listen(config.port, () => {
    logger.info(`Quantum Chat server running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
