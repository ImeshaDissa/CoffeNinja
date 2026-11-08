import {
  ERROR_CODE,
  ErrorCodeType,
  HTTP_STATUS,
} from '../../constants/domain.constants.js';

/**
 * Base operational error class following the Open/Closed Principle.
 * Subclasses define specific domain and HTTP semantics handled uniformly by the central error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly details?: unknown;

  /**
   * Constructs a structured operational application error.
   *
   * @param message - Safe, human-readable error message for the client.
   * @param statusCode - HTTP status code associated with this failure.
   * @param code - Machine-readable error code for programmatic client handling.
   * @param details - Optional structured metadata (e.g., field errors or conflict snapshot).
   */
  constructor(
    message: string,
    statusCode: number,
    code: ErrorCodeType,
    details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Error thrown when request input fails validation (HTTP 400).
 */
export class ValidationError extends AppError {
  /**
   * Creates a ValidationError instance.
   *
   * @param message - Summary validation message.
   * @param details - Field-level validation issues.
   */
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_ERROR, details);
  }
}

/**
 * Error thrown when authentication is missing, expired, or invalid (HTTP 401).
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates an UnauthorizedError instance.
   *
   * @param message - Client-safe authentication failure message.
   * @param code - Specific authentication error code.
   */
  constructor(
    message = 'Authentication is required to access this resource.',
    code: ErrorCodeType = ERROR_CODE.UNAUTHORIZED
  ) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code);
  }
}

/**
 * Error thrown when an authenticated user lacks permission for a target record (HTTP 403).
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a ForbiddenError instance.
   *
   * @param message - Client-safe authorization denial message.
   */
  constructor(message = 'You do not have permission to access or modify this inquiry.') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODE.FORBIDDEN);
  }
}

/**
 * Error thrown when a requested record does not exist (HTTP 404).
 */
export class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError instance.
   *
   * @param message - Client-safe resource-not-found message.
   */
  constructor(message = 'The requested inquiry could not be found.') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND);
  }
}

/**
 * Error thrown when a duplicate submission or stale optimistic version conflict occurs (HTTP 409).
 */
export class ConflictError extends AppError {
  /**
   * Creates a ConflictError instance.
   *
   * @param message - Explanation of the conflict.
   * @param code - Specific conflict code (DUPLICATE_INQUIRY or STALE_DATA).
   * @param details - Optional conflict context (e.g., existingInquiryId or latestRecord).
   */
  constructor(
    message: string,
    code: ErrorCodeType = ERROR_CODE.STALE_DATA,
    details?: unknown
  ) {
    super(message, HTTP_STATUS.CONFLICT, code, details);
  }
}

/**
 * Error thrown when a requested inquiry status transition violates lifecycle rules (HTTP 422).
 */
export class InvalidStatusTransitionError extends AppError {
  /**
   * Creates an InvalidStatusTransitionError instance.
   *
   * @param currentStatus - Current status of the inquiry.
   * @param targetStatus - Requested invalid target status.
   * @param reason - Domain explanation of why the transition is disallowed.
   */
  constructor(currentStatus: string, targetStatus: string, reason: string) {
    super(
      reason,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODE.INVALID_STATUS_TRANSITION,
      { currentStatus, targetStatus }
    );
  }
}

