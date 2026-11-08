import { RequestHandler } from 'express';
import { env } from './config/env.js';
import { AuthController } from './controllers/auth.controller.js';
import { InquiryController } from './controllers/inquiry.controller.js';
import { InquiryAccessPolicy } from './domain/policies/inquiry-access-policy.js';
import { InquiryStateMachine } from './domain/policies/inquiry-state-machine.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { IInquiryRepository } from './repositories/interfaces/inquiry-repository.interface.js';
import { IUserRepository } from './repositories/interfaces/user-repository.interface.js';
import { getPrismaClient } from './repositories/prisma/prisma-client.js';
import { PrismaInquiryRepository } from './repositories/prisma/prisma-inquiry.repository.js';
import { PrismaUserRepository } from './repositories/prisma/prisma-user.repository.js';
import { AuthService } from './services/auth.service.js';
import { InquiryService } from './services/inquiry.service.js';
import {
  BcryptPasswordHasher,
  IPasswordHasher,
} from './services/security/password-hasher.js';
import {
  ITokenService,
  JwtTokenService,
} from './services/security/token-service.js';

/**
 * Dependency Injection container holding wired application components.
 */
export interface AppContainer {
  readonly userRepository: IUserRepository;
  readonly inquiryRepository: IInquiryRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenService: ITokenService;
  readonly authController: AuthController;
  readonly inquiryController: InquiryController;
  readonly requireAuth: RequestHandler;
}

/**
 * Optional overrides for constructing an isolated AppContainer in automated tests.
 */
export interface ContainerOverrides {
  readonly userRepository?: IUserRepository;
  readonly inquiryRepository?: IInquiryRepository;
  readonly passwordHasher?: IPasswordHasher;
  readonly tokenService?: ITokenService;
}

/**
 * Wires repositories, domain policies, services, middlewares, and controllers
 * adhering to the Dependency Inversion Principle.
 *
 * @param overrides - Optional test doubles or custom implementations.
 * @returns Fully wired AppContainer instance.
 */
export function createAppContainer(overrides: ContainerOverrides = {}): AppContainer {
  const userRepository =
    overrides.userRepository ?? new PrismaUserRepository(getPrismaClient());
  const inquiryRepository =
    overrides.inquiryRepository ?? new PrismaInquiryRepository(getPrismaClient());
  const passwordHasher = overrides.passwordHasher ?? new BcryptPasswordHasher();
  const tokenService =
    overrides.tokenService ?? new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  const stateMachine = new InquiryStateMachine();
  const accessPolicy = new InquiryAccessPolicy();

  const authService = new AuthService(userRepository, passwordHasher, tokenService);
  const inquiryService = new InquiryService(
    inquiryRepository,
    stateMachine,
    accessPolicy
  );

  const authController = new AuthController(
    authService,
    env.NODE_ENV === 'production'
  );
  const inquiryController = new InquiryController(inquiryService);
  const requireAuth = createAuthMiddleware(tokenService, userRepository);

  return {
    userRepository,
    inquiryRepository,
    passwordHasher,
    tokenService,
    authController,
    inquiryController,
    requireAuth,
  };
}

