import bcrypt from 'bcryptjs';
import { SECURITY_CONSTANTS } from '../../constants/domain.constants.js';

/**
 * Abstraction for password hashing and verification (Interface Segregation & Dependency Inversion).
 */
export interface IPasswordHasher {
  /**
   * Generates a salted cryptographic hash for a plain-text password.
   *
   * @param plainPassword - Plain-text password to hash.
   * @returns Salted bcrypt password hash.
   */
  hash(plainPassword: string): Promise<string>;

  /**
   * Verifies a plain-text password against a stored password hash in constant time.
   *
   * @param plainPassword - Candidate plain-text password.
   * @param passwordHash - Stored password hash.
   * @returns True if the password matches the hash; false otherwise.
   */
  verify(plainPassword: string, passwordHash: string): Promise<boolean>;
}

/**
 * Bcrypt implementation of IPasswordHasher using work factor 12.
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  /**
   * Initializes BcryptPasswordHasher.
   *
   * @param saltRounds - Cost factor for bcrypt hashing (defaults to 12).
   */
  constructor(saltRounds: number = SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hashes a plain-text password with bcrypt.
   *
   * @param plainPassword - Plain-text password.
   * @returns Salted bcrypt hash string.
   */
  public async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Compares a plain-text password against a bcrypt hash.
   *
   * @param plainPassword - Candidate plain-text password.
   * @param passwordHash - Stored bcrypt hash.
   * @returns True if valid; false otherwise.
   */
  public async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

