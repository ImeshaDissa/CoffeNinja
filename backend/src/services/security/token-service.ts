import jwt, { SignOptions } from 'jsonwebtoken';
import {
  SECURITY_CONSTANTS,
  USER_ROLE,
  UserRoleType,
} from '../../constants/domain.constants.js';
import { AuthenticatedUserDto } from '../../domain/entities/user.entity.js';
import { UnauthorizedError } from '../../domain/errors/app-error.js';

/**
 * Verified claims stored inside a staff session JWT.
 */
export interface SessionTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRoleType;
}

/**
 * Abstraction for issuing and verifying session tokens (Dependency Inversion Principle).
 */
export interface ITokenService {
  /**
   * Signs a short-lived JWT for an authenticated staff member.
   *
   * @param user - Sanitized authenticated user DTO.
   * @returns Signed JWT string.
   */
  signSessionToken(user: AuthenticatedUserDto): string;

  /**
   * Cryptographically verifies a JWT and extracts its authenticated user claims.
   *
   * @param token - Raw JWT string from cookie or Authorization header.
   * @returns Verified SessionTokenPayload.
   * @throws UnauthorizedError if the token is malformed, expired, or forged.
   */
  verifySessionToken(token: string): SessionTokenPayload;
}

/**
 * JSON Web Token implementation of ITokenService with pinned HS256 algorithm, issuer, and audience.
 */
export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  /**
   * Initializes JwtTokenService.
   *
   * @param secret - High-entropy signing secret (>= 256 bits).
   * @param expiresIn - Token lifetime specification (e.g., '8h').
   */
  constructor(secret: string, expiresIn: string) {
    if (!secret || secret.length < 32) {
      throw new Error('JwtTokenService requires a secret of at least 32 characters.');
    }
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  /**
   * Signs a session JWT containing minimal non-sensitive claims.
   *
   * @param user - Authenticated staff user DTO.
   * @returns Signed JWT string.
   */
  public signSessionToken(user: AuthenticatedUserDto): string {
    const payload: SessionTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const signOptions: SignOptions = {
      algorithm: SECURITY_CONSTANTS.JWT_ALGORITHM,
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
      issuer: SECURITY_CONSTANTS.JWT_ISSUER,
      audience: SECURITY_CONSTANTS.JWT_AUDIENCE,
    };

    return jwt.sign(payload, this.secret, signOptions);
  }

  /**
   * Verifies a JWT signature, algorithm, expiration, issuer, and audience.
   *
   * @param token - Candidate JWT string.
   * @returns Validated SessionTokenPayload.
   * @throws UnauthorizedError when verification fails.
   */
  public verifySessionToken(token: string): SessionTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [SECURITY_CONSTANTS.JWT_ALGORITHM],
        issuer: SECURITY_CONSTANTS.JWT_ISSUER,
        audience: SECURITY_CONSTANTS.JWT_AUDIENCE,
      });

      if (typeof decoded !== 'object' || decoded === null) {
        throw new UnauthorizedError('Invalid session token payload.');
      }

      const candidate = decoded as Record<string, unknown>;
      const validRole =
        candidate.role === USER_ROLE.STAFF || candidate.role === USER_ROLE.MANAGER;

      if (
        typeof candidate.sub !== 'string' ||
        typeof candidate.email !== 'string' ||
        typeof candidate.name !== 'string' ||
        !validRole
      ) {
        throw new UnauthorizedError('Malformed session token claims.');
      }

      return {
        sub: candidate.sub,
        email: candidate.email,
        name: candidate.name,
        role: candidate.role as UserRoleType,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Your session is invalid or has expired. Please sign in again.');
    }
  }
}

