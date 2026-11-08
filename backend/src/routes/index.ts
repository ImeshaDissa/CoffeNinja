import { RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  ERROR_CODE,
  HTTP_STATUS,
} from '../constants/domain.constants.js';
import { AuthController } from '../controllers/auth.controller.js';
import { InquiryController } from '../controllers/inquiry.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { loginBodySchema } from '../validators/auth.validator.js';
import {
  createInquiryBodySchema,
  inquiryIdParamSchema,
  listInquiriesQuerySchema,
  updateInquiryStatusBodySchema,
} from '../validators/inquiry.validator.js';

/**
 * Dependencies required to wire API routes.
 */
export interface ApiRouterDependencies {
  readonly authController: AuthController;
  readonly inquiryController: InquiryController;
  readonly requireAuth: RequestHandler;
  readonly enableRateLimit?: boolean;
}

/**
 * Builds the rate limiter specifically protecting the staff login endpoint against brute-force attacks.
 *
 * @param enabled - Whether rate limiting is active (disabled only in isolated unit tests if specified).
 * @returns Express RequestHandler enforcing login rate limits.
 */
function createLoginRateLimiter(enabled: boolean): RequestHandler {
  if (!enabled) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: ERROR_CODE.RATE_LIMIT_EXCEEDED,
          message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
        },
      });
    },
  });
}

/**
 * Creates the versioned /api/v1 Express Router with deny-by-default authentication on protected routes.
 *
 * @param deps - Controller and middleware dependencies.
 * @returns Configured Express Router.
 */
export function createApiRouter(deps: ApiRouterDependencies): Router {
  const router = Router();
  const loginLimiter = createLoginRateLimiter(deps.enableRateLimit ?? true);

  /**
   * Public health check route: used by local dev scripts and readiness probes.
   */
  router.get('/health', (_req, res) => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * Public route: Staff sign-in endpoint (must be accessible before a session exists).
   */
  router.post(
    '/auth/login',
    loginLimiter,
    validateRequest({ body: loginBodySchema }),
    deps.authController.login
  );

  /**
   * Public route: Staff sign-out endpoint (clears session cookie even if expired).
   */
  router.post('/auth/logout', deps.authController.logout);

  /**
   * Protected route: Inspect currently signed-in staff session.
   */
  router.get('/auth/me', deps.requireAuth, deps.authController.getCurrentSession);

  /**
   * Protected Inquiry routes: All routes enforce authentication AND object-level authorization.
   */
  router.get(
    '/inquiries',
    deps.requireAuth,
    validateRequest({ query: listInquiriesQuerySchema }),
    deps.inquiryController.listInquiries
  );

  router.post(
    '/inquiries',
    deps.requireAuth,
    validateRequest({ body: createInquiryBodySchema }),
    deps.inquiryController.createInquiry
  );

  router.get(
    '/inquiries/:id',
    deps.requireAuth,
    validateRequest({ params: inquiryIdParamSchema }),
    deps.inquiryController.getInquiryById
  );

  router.patch(
    '/inquiries/:id/status',
    deps.requireAuth,
    validateRequest({
      params: inquiryIdParamSchema,
      body: updateInquiryStatusBodySchema,
    }),
    deps.inquiryController.updateInquiryStatus
  );

  return router;
}

