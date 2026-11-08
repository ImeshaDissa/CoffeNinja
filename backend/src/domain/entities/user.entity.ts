import { UserRoleType } from '../../constants/domain.constants.js';

/**
 * Full internal User domain record (includes passwordHash for authentication checks only).
 */
export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly role: UserRoleType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Public-safe User DTO safe to return in API responses (never contains passwordHash).
 */
export interface AuthenticatedUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRoleType;
}

/**
 * Maps an internal UserRecord into a public-safe AuthenticatedUserDto.
 *
 * @param user - Internal user record retrieved from persistence.
 * @returns Sanitized user DTO without sensitive fields.
 */
export function toAuthenticatedUserDto(user: UserRecord): AuthenticatedUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

