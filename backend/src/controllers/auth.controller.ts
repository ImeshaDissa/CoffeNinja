import { CookieOptions, NextFunction, Request, Response } from 'express';
import {
  HTTP_STATUS,
  SECURITY_CONSTANTS,
} from '../constants/domain.constants.js';
import { UnauthorizedError } from '../domain/errors/app-error.js';
import { IAuthService } from '../services/auth.service.js';
import { LoginBodyDto } from '../validators/auth.validator.js';

/**
 * HTTP Controller responsible solely for staff authentication endpoints (Single Responsibility).
 */
export class AuthController {
  private readonly authService: IAuthService;
  private readonly isProduction: boolean;

  /**
   * Initializes AuthController with an injected IAuthService.
   *
   * @param authService - Authentication business service.
   * @param isProduction - Whether secure HTTPS-only cookie flag should be enabled.
   */
  constructor(authService: IAuthService, isProduction: boolean) {
    this.authService = authService;
    this.isProduction = isProduction;
  }

  /**
   * Builds hardened httpOnly session cookie options.
   *
   * @returns Express CookieOptions object.
   */
  private getSessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      maxAge: SECURITY_CONSTANTS.MAX_COOKIE_AGE_MS,
      path: '/',
    };
  }

  /**
   * Handles POST /api/v1/auth/login requests.
   *
   * @param req - Express Request containing validated LoginBodyDto.
   * @param res - Express Response setting httpOnly cookie and returning user DTO.
   * @param next - Express NextFunction for central error delegation.
   */
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as LoginBodyDto;
      const result = await this.authService.login(body.email, body.password);

      res.cookie(
        SECURITY_CONSTANTS.AUTH_COOKIE_NAME,
        result.token,
        this.getSessionCookieOptions()
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/v1/auth/logout requests by clearing the httpOnly session cookie.
   *
   * @param _req - Express Request.
   * @param res - Express Response clearing session cookie.
   * @param next - Express NextFunction.
   */
  public logout = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      res.clearCookie(SECURITY_CONSTANTS.AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'lax',
        path: '/',
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Signed out successfully.',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/v1/auth/me requests to inspect the current authenticated session.
   *
   * @param req - Express Request populated by authentication middleware.
   * @param res - Express Response returning the authenticated staff user DTO.
   * @param next - Express NextFunction.
   */
  public getCurrentSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}

