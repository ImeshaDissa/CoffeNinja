import { NextFunction, Request, RequestHandler, Response } from 'express';
import { SECURITY_CONSTANTS } from '../constants/domain.constants.js';
import { AuthenticatedUserDto } from '../domain/entities/user.entity.js';
import { UnauthorizedError } from '../domain/errors/app-error.js';
import { IUserRepository } from '../repositories/interfaces/user-repository.interface.js';
import { ITokenService } from '../services/security/token-service.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserDto;
    }
  }
}

/**
 * Extracts a raw JWT string from either the httpOnly session cookie or Bearer Authorization header.
 *
 * @param req - Incoming Express Request.
 * @returns Raw JWT string, or null if absent.
 */
export function extractSessionToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SECURITY_CONSTANTS.AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return null;
}

/**
 * Factory creating Express authentication middleware that verifies session tokens
 * and confirms the staff user record exists in persistence (deny-by-default).
 *
 * @param tokenService - Session token verification abstraction.
 * @param userRepository - Staff user repository to verify active status and latest role.
 * @returns Express RequestHandler attaching verified AuthenticatedUserDto to req.user.
 */
export function createAuthMiddleware(
  tokenService: ITokenService,
  userRepository: IUserRepository
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractSessionToken(req);
      if (!token) {
        throw new UnauthorizedError('Please sign in to access the workspace.');
      }

      const payload = tokenService.verifySessionToken(token);
      const activeUser = await userRepository.findById(payload.sub);

      if (!activeUser) {
        throw new UnauthorizedError('Your staff account session is no longer valid.');
      }

      req.user = {
        id: activeUser.id,
        email: activeUser.email,
        name: activeUser.name,
        role: activeUser.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

