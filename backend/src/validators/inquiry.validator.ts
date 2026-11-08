import { z } from 'zod';
import {
  FIELD_LIMITS,
  INQUIRY_STATUS,
  PAGINATION_LIMITS,
} from '../constants/domain.constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_CHARS_REGEX = /^[+]?[0-9\s\-().]{7,25}$/;

/**
 * Validates whether a contact string represents either a valid email address or phone number.
 *
 * @param rawValue - Trimmed customer contact info string.
 * @returns True if formatted as a valid email or phone number with at least 7 digits.
 */
export function isValidContactInfo(rawValue: string): boolean {
  const value = rawValue.trim();
  if (EMAIL_REGEX.test(value)) {
    return true;
  }

  if (!PHONE_ALLOWED_CHARS_REGEX.test(value)) {
    return false;
  }

  const digitCount = value.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15;
}

/**
 * Strict Zod schema for recording a new customer inquiry.
 */
export const createInquiryBodySchema = z
  .object({
    customerName: z
      .string({ required_error: 'Customer name is required.' })
      .trim()
      .min(
        FIELD_LIMITS.CUSTOMER_NAME_MIN,
        `Customer name must be at least ${FIELD_LIMITS.CUSTOMER_NAME_MIN} characters.`
      )
      .max(
        FIELD_LIMITS.CUSTOMER_NAME_MAX,
        `Customer name cannot exceed ${FIELD_LIMITS.CUSTOMER_NAME_MAX} characters.`
      ),
    contactInfo: z
      .string({ required_error: 'Customer contact information is required.' })
      .trim()
      .min(
        FIELD_LIMITS.CONTACT_INFO_MIN,
        'Please provide a valid email address or phone number.'
      )
      .max(
        FIELD_LIMITS.CONTACT_INFO_MAX,
        `Contact info cannot exceed ${FIELD_LIMITS.CONTACT_INFO_MAX} characters.`
      )
      .refine(
        isValidContactInfo,
        'Contact info must be a valid email address (e.g. name@domain.com) or phone number (at least 7 digits).'
      ),
    subject: z
      .string({ required_error: 'Subject is required.' })
      .trim()
      .min(
        FIELD_LIMITS.SUBJECT_MIN,
        `Subject must be at least ${FIELD_LIMITS.SUBJECT_MIN} characters.`
      )
      .max(
        FIELD_LIMITS.SUBJECT_MAX,
        `Subject cannot exceed ${FIELD_LIMITS.SUBJECT_MAX} characters.`
      ),
    description: z
      .string({ required_error: 'Inquiry description is required.' })
      .trim()
      .min(
        FIELD_LIMITS.DESCRIPTION_MIN,
        `Description must be at least ${FIELD_LIMITS.DESCRIPTION_MIN} characters.`
      )
      .max(
        FIELD_LIMITS.DESCRIPTION_MAX,
        `Description cannot exceed ${FIELD_LIMITS.DESCRIPTION_MAX} characters.`
      ),
  })
  .strict();

export type CreateInquiryBodyDto = z.infer<typeof createInquiryBodySchema>;

/**
 * Strict Zod schema for URL route parameters containing an inquiry UUID.
 */
export const inquiryIdParamSchema = z
  .object({
    id: z.string().uuid('Inquiry ID must be a valid UUID format.'),
  })
  .strict();

export type InquiryIdParamDto = z.infer<typeof inquiryIdParamSchema>;

/**
 * Strict Zod schema for listing, filtering, and searching inquiries.
 */
export const listInquiriesQuerySchema = z
  .object({
    status: z
      .enum([
        INQUIRY_STATUS.NEW,
        INQUIRY_STATUS.IN_PROGRESS,
        INQUIRY_STATUS.RESOLVED,
      ])
      .optional(),
    search: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.SEARCH_QUERY_MAX,
        `Search query cannot exceed ${FIELD_LIMITS.SEARCH_QUERY_MAX} characters.`
      )
      .optional(),
    page: z.coerce
      .number()
      .int('Page must be an integer.')
      .min(1, 'Page must be at least 1.')
      .default(PAGINATION_LIMITS.DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int('Page size must be an integer.')
      .min(1, 'Page size must be at least 1.')
      .max(
        PAGINATION_LIMITS.MAX_PAGE_SIZE,
        `Page size cannot exceed ${PAGINATION_LIMITS.MAX_PAGE_SIZE}.`
      )
      .default(PAGINATION_LIMITS.DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListInquiriesQueryDto = z.infer<typeof listInquiriesQuerySchema>;

/**
 * Strict Zod schema for transitioning an inquiry's status with optimistic locking.
 */
export const updateInquiryStatusBodySchema = z
  .object({
    status: z.enum(
      [INQUIRY_STATUS.NEW, INQUIRY_STATUS.IN_PROGRESS, INQUIRY_STATUS.RESOLVED],
      {
        errorMap: () => ({
          message: 'Status must be one of NEW, IN_PROGRESS, or RESOLVED.',
        }),
      }
    ),
    expectedVersion: z
      .number({ required_error: 'expectedVersion is required for concurrency safety.' })
      .int('expectedVersion must be an integer.')
      .positive('expectedVersion must be a positive integer.'),
    resolutionNote: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.RESOLUTION_NOTE_MAX,
        `Note cannot exceed ${FIELD_LIMITS.RESOLUTION_NOTE_MAX} characters.`
      )
      .nullable()
      .optional(),
  })
  .strict();

export type UpdateInquiryStatusBodyDto = z.infer<typeof updateInquiryStatusBodySchema>;

