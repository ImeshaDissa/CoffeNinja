import {
  CreateInquiryInput,
  InquiryRecord,
  ListInquiriesFilter,
  PaginatedInquiriesResult,
  UpdateInquiryStatusInput,
} from '../../domain/entities/inquiry.entity.js';

/**
 * Persistence contract for Customer Inquiry records (Dependency Inversion Principle).
 */
export interface IInquiryRepository {
  /**
   * Creates a new customer inquiry record with initial status NEW and version 1.
   *
   * @param input - Validated inquiry creation attributes.
   * @returns Newly persisted InquiryRecord.
   */
  create(input: CreateInquiryInput): Promise<InquiryRecord>;

  /**
   * Retrieves a single inquiry by its UUID.
   *
   * @param id - Inquiry UUID.
   * @returns Matching InquiryRecord or null if not found.
   */
  findById(id: string): Promise<InquiryRecord | null>;

  /**
   * Finds an existing unresolved (NEW or IN_PROGRESS) inquiry matching normalized contact and subject.
   * Used to enforce the duplicate submission policy without an elaborate deduplication engine.
   *
   * @param contactInfo - Normalized customer contact info.
   * @param subject - Normalized inquiry subject.
   * @returns Active matching InquiryRecord or null if none exists.
   */
  findActiveDuplicate(contactInfo: string, subject: string): Promise<InquiryRecord | null>;

  /**
   * Retrieves a paginated list of inquiries matching optional owner, status, and search filters.
   *
   * @param filter - Scoped query and pagination parameters.
   * @returns Paginated inquiry records and total metadata.
   */
  findManyPaginated(
    filter: ListInquiriesFilter
  ): Promise<PaginatedInquiriesResult<InquiryRecord>>;

  /**
   * Atomically updates an inquiry's status and increments its version only if expectedVersion matches.
   *
   * @param input - Status update payload including expectedVersion for optimistic concurrency.
   * @returns Updated InquiryRecord if version matched, or null if a concurrent modification occurred.
   */
  updateStatusWithVersion(input: UpdateInquiryStatusInput): Promise<InquiryRecord | null>;
}

