import { randomUUID } from 'node:crypto';
import {
  INQUIRY_STATUS,
  PAGINATION_LIMITS,
} from '../../constants/domain.constants.js';
import {
  CreateInquiryInput,
  InquiryRecord,
  ListInquiriesFilter,
  PaginatedInquiriesResult,
  UpdateInquiryStatusInput,
} from '../../domain/entities/inquiry.entity.js';
import { UserRecord } from '../../domain/entities/user.entity.js';
import { IInquiryRepository } from '../interfaces/inquiry-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';

/**
 * In-memory implementation of IUserRepository adhering to Liskov Substitution Principle.
 * Designed for fast, isolated unit and integration testing without external I/O.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserRecord>();

  /**
   * Initializes InMemoryUserRepository with optional seed users.
   *
   * @param initialUsers - Initial user records to populate.
   */
  constructor(initialUsers: readonly UserRecord[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  /**
   * Finds a user record by normalized email address.
   *
   * @param email - Normalized email address.
   * @returns Matching UserRecord or null.
   */
  public async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  /**
   * Finds a user record by unique UUID.
   *
   * @param id - User UUID.
   * @returns Matching UserRecord or null.
   */
  public async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }
}

/**
 * In-memory implementation of IInquiryRepository adhering to Liskov Substitution Principle.
 * Enforces identical filtering, pagination, duplicate detection, and optimistic locking semantics.
 */
export class InMemoryInquiryRepository implements IInquiryRepository {
  private readonly inquiries = new Map<string, InquiryRecord>();
  private readonly userRepository: IUserRepository;

  /**
   * Initializes InMemoryInquiryRepository.
   *
   * @param userRepository - User repository used to resolve owner summaries.
   * @param initialInquiries - Optional initial inquiry records.
   */
  constructor(
    userRepository: IUserRepository,
    initialInquiries: readonly InquiryRecord[] = []
  ) {
    this.userRepository = userRepository;
    for (const inquiry of initialInquiries) {
      this.inquiries.set(inquiry.id, inquiry);
    }
  }

  /**
   * Creates a new inquiry in memory with initial status NEW and version 1.
   *
   * @param input - Validated inquiry creation attributes.
   * @returns Newly created InquiryRecord.
   */
  public async create(input: CreateInquiryInput): Promise<InquiryRecord> {
    const owner = await this.userRepository.findById(input.ownerId);
    if (!owner) {
      throw new Error(`Owner with ID ${input.ownerId} does not exist.`);
    }

    const now = new Date();
    const record: InquiryRecord = {
      id: randomUUID(),
      customerName: input.customerName,
      contactInfo: input.contactInfo,
      subject: input.subject,
      description: input.description,
      resolutionNote: null,
      status: INQUIRY_STATUS.NEW,
      version: 1,
      ownerId: input.ownerId,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.inquiries.set(record.id, record);
    return record;
  }

  /**
   * Retrieves a single inquiry by UUID.
   *
   * @param id - Inquiry UUID.
   * @returns Matching InquiryRecord or null.
   */
  public async findById(id: string): Promise<InquiryRecord | null> {
    return this.inquiries.get(id) ?? null;
  }

  /**
   * Finds an existing unresolved (NEW or IN_PROGRESS) inquiry matching contact and subject.
   *
   * @param contactInfo - Customer contact info.
   * @param subject - Inquiry subject.
   * @returns Active matching InquiryRecord or null.
   */
  public async findActiveDuplicate(
    contactInfo: string,
    subject: string
  ): Promise<InquiryRecord | null> {
    const normalizedContact = contactInfo.trim().toLowerCase();
    const normalizedSubject = subject.trim().toLowerCase();

    for (const record of this.inquiries.values()) {
      const isUnresolved =
        record.status === INQUIRY_STATUS.NEW ||
        record.status === INQUIRY_STATUS.IN_PROGRESS;
      const matchesContact = record.contactInfo.trim().toLowerCase() === normalizedContact;
      const matchesSubject = record.subject.trim().toLowerCase() === normalizedSubject;

      if (isUnresolved && matchesContact && matchesSubject) {
        return record;
      }
    }

    return null;
  }

  /**
   * Retrieves a paginated list of inquiries matching owner, status, and search filters.
   *
   * @param filter - Query and pagination options.
   * @returns Paginated inquiry result.
   */
  public async findManyPaginated(
    filter: ListInquiriesFilter
  ): Promise<PaginatedInquiriesResult<InquiryRecord>> {
    const safePage = Math.max(1, filter.page);
    const safePageSize = Math.min(
      Math.max(1, filter.pageSize),
      PAGINATION_LIMITS.MAX_PAGE_SIZE
    );
    const searchTerm = filter.search?.trim().toLowerCase();

    const ownerScoped = Array.from(this.inquiries.values()).filter((record) =>
      filter.ownerId ? record.ownerId === filter.ownerId : true
    );

    const statusCounts = {
      total: ownerScoped.length,
      NEW: ownerScoped.filter((r) => r.status === INQUIRY_STATUS.NEW).length,
      IN_PROGRESS: ownerScoped.filter((r) => r.status === INQUIRY_STATUS.IN_PROGRESS)
        .length,
      RESOLVED: ownerScoped.filter((r) => r.status === INQUIRY_STATUS.RESOLVED).length,
    };

    const filtered = ownerScoped
      .filter((record) => {
        if (filter.status && record.status !== filter.status) {
          return false;
        }
        if (searchTerm) {
          const matchesSearch =
            record.customerName.toLowerCase().includes(searchTerm) ||
            record.contactInfo.toLowerCase().includes(searchTerm) ||
            record.subject.toLowerCase().includes(searchTerm) ||
            record.description.toLowerCase().includes(searchTerm);
          if (!matchesSearch) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const total = filtered.length;
    const skip = (safePage - 1) * safePageSize;
    const items = filtered.slice(skip, skip + safePageSize);

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      statusCounts,
    };
  }

  /**
   * Atomically updates an inquiry's status and increments version if expectedVersion matches.
   *
   * @param input - Status update payload with optimistic lock version.
   * @returns Updated InquiryRecord or null if version mismatch occurred.
   */
  public async updateStatusWithVersion(
    input: UpdateInquiryStatusInput
  ): Promise<InquiryRecord | null> {
    const existing = this.inquiries.get(input.inquiryId);
    if (!existing || existing.version !== input.expectedVersion) {
      return null;
    }

    const updated: InquiryRecord = {
      ...existing,
      status: input.nextStatus,
      version: existing.version + 1,
      resolutionNote:
        input.resolutionNote !== undefined ? input.resolutionNote : existing.resolutionNote,
      updatedAt: new Date(),
    };

    this.inquiries.set(updated.id, updated);
    return updated;
  }
}

