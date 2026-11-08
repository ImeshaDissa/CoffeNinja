import { ERROR_CODE } from '../constants/domain.constants.js';
import {
  AuthenticatedUserDto,
  toAuthenticatedUserDto,
} from '../domain/entities/user.entity.js';
import { UnauthorizedError } from '../domain/errors/app-error.js';
import { IUserRepository } from '../repositories/interfaces/user-repository.interface.js';
import { IPasswordHasher } from './security/password-hasher.js';
import { ITokenService } from './security/token-service.js';

/**
 * Precomputed dummy bcrypt hash (cost 12) used when a login email does not exist,
 * mitigating user-enumeration timing attacks.
 */
const DUMMY_BCRYPT_HASH =
  '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

/**
 * Result returned upon successful staff authentication.
 */
export interface LoginResult {
  readonly user: AuthenticatedUserDto;
  readonly token: string;
}

/**
 * Service contract for staff authentication operations.
 */
export interface IAuthService {
  /**
   * Authenticates a staff member with email and password.
   *
   * @param email - Staff email address.
   * @param password - Plain-text password.
   * @returns Sanitized user DTO and signed session token.
   */
  login(email: string, password: string): Promise<LoginResult>;

  /**
   * Retrieves the current authenticated staff profile by user ID.
   *
   * @param userId - Verified user UUID from session token.
   * @returns Sanitized AuthenticatedUserDto.
   */
  getCurrentUser(userId: string): Promise<AuthenticatedUserDto>;
}

/**
 * Orchestrates staff sign-in and session verification.
 */
export class AuthService implements IAuthService {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenService: ITokenService;

  /**
   * Initializes AuthService with injected persistence and security abstractions.
   *
   * @param userRepository - Staff user persistence repository.
   * @param passwordHasher - Password hashing and verification service.
   * @param tokenService - Session token issuing and verification service.
   */
  constructor(
    userRepository: IUserRepository,
    passwordHasher: IPasswordHasher,
    tokenService: ITokenService
  ) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  /**
   * Authenticates a staff member and issues a session JWT.
   * Returns a generic error message on failure to prevent account enumeration.
   *
   * @param email - Staff email address.
   * @param password - Candidate plain-text password.
   * @returns LoginResult containing sanitized user DTO and session JWT.
   * @throws UnauthorizedError if credentials do not match a valid staff account.
   */
  public async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const userRecord = await this.userRepository.findByEmail(normalizedEmail);

    if (!userRecord) {
      await this.passwordHasher.verify(password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedError(
        'Invalid email or password.',
        ERROR_CODE.INVALID_CREDENTIALS
      );
    }

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      userRecord.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError(
        'Invalid email or password.',
        ERROR_CODE.INVALID_CREDENTIALS
      );
    }

    const userDto = toAuthenticatedUserDto(userRecord);
    const token = this.tokenService.signSessionToken(userDto);

    return {
      user: userDto,
      token,
    };
  }

  /**
   * Resolves the current signed-in user record from persistence to confirm the account remains active.
   *
   * @param userId - User UUID extracted from verified token.
   * @returns Sanitized AuthenticatedUserDto.
   * @throws UnauthorizedError if the user record no longer exists.
   */
  public async getCurrentUser(userId: string): Promise<AuthenticatedUserDto> {
    const userRecord = await this.userRepository.findById(userId);
    if (!userRecord) {
      throw new UnauthorizedError('Staff account is no longer active. Please sign in again.');
    }
    return toAuthenticatedUserDto(userRecord);
  }
}

