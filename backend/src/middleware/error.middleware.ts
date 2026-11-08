import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import {
  ERROR_CODE,
  HTTP_STATUS,
} from '../constants/domain.constants.js';
import { AppError } from '../domain/errors/app-error.js';

/**
 * Express middleware handling unmatched API routes with a predictable 404 JSON envelope.
 *
 * @param req - Incoming Express Request.
 * @param _res - Express Response.
 * @param next - Express NextFunction.
 */
export function notFoundRouteHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(
    new AppError(
      `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODE.NOT_FOUND
    )
  );
}

/**
 * Central Express error handler that formats operational errors consistently
 * and masks unexpected internal/database errors behind a correlation ID.
 *
 * @param err - Caught error object.
 * @param req - Incoming Express Request.
 * @param res - Outgoing Express Response.
 * @param _next - Express NextFunction (required 4-arg signature for Express error handlers).
 */
export function centralErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = randomUUID();

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODE.VALIDATION_ERROR,
        message: 'Malformed JSON payload in request body.',
        correlationId,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode === HTTP_STATUS.UNAUTHORIZED || err.statusCode === HTTP_STATUS.FORBIDDEN) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          JSON.stringify({
            level: 'security_event',
            correlationId,
            code: err.code,
            statusCode: err.statusCode,
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id ?? 'anonymous',
            ip: req.ip,
            timestamp: new Date().toISOString(),
          })
        );
      }
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
        correlationId,
      },
    });
    return;
  }

  console.error(
    JSON.stringify({
      level: 'unhandled_error',
      correlationId,
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id ?? 'anonymous',
      errorName: err instanceof Error ? err.name : 'UnknownError',
      errorMessage: err instanceof Error ? err.message : 'Unexpected failure',
      timestamp: new Date().toISOString(),
    })
  );

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODE.INTERNAL_ERROR,
      message: 'An unexpected server error occurred. Please try again later.',
      correlationId,
    },
  });
}

