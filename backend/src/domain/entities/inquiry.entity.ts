import { InquiryStatusType } from '../../constants/domain.constants.js';

/**
 * Summary of the staff member who recorded/owns an inquiry.
 */
export interface InquiryOwnerSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

/**
 * Domain representation of a Customer Inquiry with safe public fields.
 */
export interface InquiryDto {
  readonly id: string;
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
  readonly resolutionNote: string | null;
  readonly status: InquiryStatusType;
  readonly version: number;
  readonly ownerId: string;
  readonly owner: InquiryOwnerSummaryDto;
  readonly allowedTransitions: readonly InquiryStatusType[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Persistence entity returned by IInquiryRepository before attaching allowed transitions.
 */
export interface InquiryRecord {
  readonly id: string;
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
  readonly resolutionNote: string | null;
  readonly status: InquiryStatusType;
  readonly version: number;
  readonly ownerId: string;
  readonly owner: InquiryOwnerSummaryDto;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Input payload required to persist a newly recorded customer inquiry.
 */
export interface CreateInquiryInput {
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
  readonly ownerId: string;
}

/**
 * Input payload required to list and filter inquiries with pagination.
 */
export interface ListInquiriesFilter {
  readonly ownerId?: string;
  readonly status?: InquiryStatusType;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Aggregated counts of inquiries by status within the caller's authorized scope.
 */
export interface InquiryStatusCounts {
  readonly total: number;
  readonly NEW: number;
  readonly IN_PROGRESS: number;
  readonly RESOLVED: number;
}

/**
 * Paginated list response structure for inquiries, including workspace KPI status counts.
 */
export interface PaginatedInquiriesResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly statusCounts: InquiryStatusCounts;
}

/**
 * Input payload for updating an inquiry's lifecycle status with optimistic concurrency.
 */
export interface UpdateInquiryStatusInput {
  readonly inquiryId: string;
  readonly nextStatus: InquiryStatusType;
  readonly expectedVersion: number;
  readonly resolutionNote?: string | null;
}
