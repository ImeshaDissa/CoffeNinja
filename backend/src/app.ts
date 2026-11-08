import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import {
  ERROR_CODE,
  HTTP_STATUS,
  SECURITY_CONSTANTS,
} from './constants/domain.constants.js';
import {
  ContainerOverrides,
  createAppContainer,
} from './container.js';
import {
  centralErrorHandler,
  notFoundRouteHandler,
} from './middleware/error.middleware.js';
import { createApiRouter } from './routes/index.js';

/**
 * Options for creating and configuring the Express application instance.
 */
export interface CreateAppOptions extends ContainerOverrides {
  readonly enableRateLimit?: boolean;
}

/**
 * Constructs and hardens the Express application with security headers, strict CORS,
 * payload size caps, cookie parsing, versioned API routes, and central error handling.
 *
 * @param options - Optional dependency overrides and configuration flags.
 * @returns Configured Express application ready to handle requests or Supertest assertions.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const container = createAppContainer(options);
  const enableRateLimit = options.enableRateLimit ?? env.NODE_ENV !== 'test';

  app.disable('x-powered-by');
  app.use(helmet());

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin not permitted by CORS policy.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  if (enableRateLimit) {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        max: 120,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            error: {
              code: ERROR_CODE.RATE_LIMIT_EXCEEDED,
              message: 'Too many requests from this IP. Please slow down.',
            },
          });
        },
      })
    );
  }

  app.use(express.json({ limit: SECURITY_CONSTANTS.JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.use(
    '/api/v1',
    createApiRouter({
      authController: container.authController,
      inquiryController: container.inquiryController,
      requireAuth: container.requireAuth,
      enableRateLimit,
    })
  );

  app.use(notFoundRouteHandler);
  app.use(centralErrorHandler);

  return app;
}

