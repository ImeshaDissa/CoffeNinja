import { UserRecord } from '../../domain/entities/user.entity.js';

/**
 * Persistence contract for retrieving staff user records (Interface Segregation Principle).
 */
export interface IUserRepository {
  /**
   * Finds a user record by normalized email address.
   *
   * @param email - Normalized (lowercase, trimmed) email address.
   * @returns Matching UserRecord or null if none exists.
   */
  findByEmail(email: string): Promise<UserRecord | null>;

  /**
   * Finds a user record by unique user UUID.
   *
   * @param id - User UUID.
   * @returns Matching UserRecord or null if none exists.
   */
  findById(id: string): Promise<UserRecord | null>;
}

