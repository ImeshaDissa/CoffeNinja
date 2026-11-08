import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../domain/errors/app-error.js';

/**
 * Configuration specifying which segments of an incoming HTTP request to validate.
 */
export interface ValidationTargets {
  readonly body?: ZodTypeAny;
  readonly params?: ZodTypeAny;
  readonly query?: ZodTypeAny;
}

/**
 * Formats Zod validation issues into a clean field-keyed map for UI form feedback.
 *
 * @param error - ZodError instance containing schema violations.
 * @returns Structured array of field validation errors.
 */
export function formatZodIssues(
  error: ZodError
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'request',
    message: issue.message,
  }));
}

/**
 * Creates an Express middleware that validates request body, params, and/or query
 * against strict Zod schemas before reaching any controller logic.
 *
 * @param schemas - Zod schemas for body, params, and/or query.
 * @returns Express RequestHandler enforcing input validation.
 */
export function validateRequest(schemas: ValidationTargets): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = formatZodIssues(error);
        const primaryMessage =
          fieldErrors[0]?.message ?? 'Request validation failed. Please check your input.';
        next(new ValidationError(primaryMessage, { fields: fieldErrors }));
        return;
      }
      next(error);
    }
  };
}

