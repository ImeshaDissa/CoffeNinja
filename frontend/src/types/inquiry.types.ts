/**
 * Centralized frontend domain types, status constants, and API response contracts.
 */

export const USER_ROLE = {
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const INQUIRY_STATUS = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export type InquiryStatus = (typeof INQUIRY_STATUS)[keyof typeof INQUIRY_STATUS];

export const STATUS_LABELS: Readonly<Record<InquiryStatus, string>> = {
  [INQUIRY_STATUS.NEW]: 'New',
  [INQUIRY_STATUS.IN_PROGRESS]: 'In Progress',
  [INQUIRY_STATUS.RESOLVED]: 'Resolved',
};

export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_INQUIRY: 'DUPLICATE_INQUIRY',
  STALE_DATA: 'STALE_DATA',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
}

export interface InquiryOwnerSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface Inquiry {
  readonly id: string;
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
  readonly resolutionNote: string | null;
  readonly status: InquiryStatus;
  readonly version: number;
  readonly ownerId: string;
  readonly owner: InquiryOwnerSummary;
  readonly allowedTransitions: readonly InquiryStatus[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InquiryStatusCounts {
  readonly total: number;
  readonly NEW: number;
  readonly IN_PROGRESS: number;
  readonly RESOLVED: number;
}

export interface PaginatedInquiries {
  readonly items: readonly Inquiry[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly statusCounts?: InquiryStatusCounts;
}

export interface CreateInquiryPayload {
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
}

export interface UpdateInquiryStatusPayload {
  readonly status: InquiryStatus;
  readonly expectedVersion: number;
  readonly resolutionNote?: string | null;
}

export interface ListInquiriesParams {
  readonly status?: InquiryStatus;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ValidationFieldError {
  readonly field: string;
  readonly message: string;
}

export interface ApiErrorDetails {
  readonly fields?: readonly ValidationFieldError[];
  readonly existingInquiryId?: string;
  readonly latestInquiry?: Inquiry;
  readonly currentStatus?: InquiryStatus;
  readonly targetStatus?: InquiryStatus;
}

export interface ApiErrorPayload {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: ApiErrorDetails;
  readonly correlationId?: string;
}

export interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
}

export interface ApiErrorEnvelope {
  readonly success: false;
  readonly error: ApiErrorPayload;
}

