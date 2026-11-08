import { Prisma, PrismaClient } from '@prisma/client';
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
import { IInquiryRepository } from '../interfaces/inquiry-repository.interface.js';

/**
 * Explicit Prisma field selection for Inquiry records.
 * Guarantees owner.passwordHash and internal fields are never fetched or exposed.
 */
const INQUIRY_SELECT = {
  id: true,
  customerName: true,
  contactInfo: true,
  subject: true,
  description: true,
  resolutionNote: true,
  status: true,
  version: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

/**
 * PostgreSQL implementation of IInquiryRepository backed by Prisma.
 */
export class PrismaInquiryRepository implements IInquiryRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes PrismaInquiryRepository with an injected PrismaClient.
   *
   * @param prisma - Prisma database client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Creates a new customer inquiry record with initial status NEW and version 1.
   *
   * @param input - Validated inquiry creation attributes.
   * @returns Newly persisted InquiryRecord.
   */
  public async create(input: CreateInquiryInput): Promise<InquiryRecord> {
    return this.prisma.inquiry.create({
      data: {
        customerName: input.customerName,
        contactInfo: input.contactInfo,
        subject: input.subject,
        description: input.description,
        ownerId: input.ownerId,
        status: INQUIRY_STATUS.NEW,
        version: 1,
      },
      select: INQUIRY_SELECT,
    });
  }

  /**
   * Retrieves a single inquiry by its UUID using explicit field selection.
   *
   * @param id - Inquiry UUID.
   * @returns Matching InquiryRecord or null if not found.
   */
  public async findById(id: string): Promise<InquiryRecord | null> {
    return this.prisma.inquiry.findUnique({
      where: { id },
      select: INQUIRY_SELECT,
    });
  }

  /**
   * Finds an existing unresolved (NEW or IN_PROGRESS) inquiry matching normalized contact and subject.
   *
   * @param contactInfo - Trimmed customer contact info.
   * @param subject - Trimmed inquiry subject.
   * @returns Active matching InquiryRecord or null if none exists.
   */
  public async findActiveDuplicate(
    contactInfo: string,
    subject: string
  ): Promise<InquiryRecord | null> {
    return this.prisma.inquiry.findFirst({
      where: {
        contactInfo: {
          equals: contactInfo.trim(),
          mode: 'insensitive',
        },
        subject: {
          equals: subject.trim(),
          mode: 'insensitive',
        },
        status: {
          in: [INQUIRY_STATUS.NEW, INQUIRY_STATUS.IN_PROGRESS],
        },
      },
      select: INQUIRY_SELECT,
    });
  }

  /**
   * Builds a parameterized Prisma where-clause from validated filter criteria.
   *
   * @param filter - Scoped query and search parameters.
   * @returns Type-safe Prisma.InquiryWhereInput object.
   */
  private buildWhereClause(filter: ListInquiriesFilter): Prisma.InquiryWhereInput {
    const where: Prisma.InquiryWhereInput = {};

    if (filter.ownerId) {
      where.ownerId = filter.ownerId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search && filter.search.trim().length > 0) {
      const term = filter.search.trim();
      where.OR = [
        { customerName: { contains: term, mode: 'insensitive' } },
        { contactInfo: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Retrieves a paginated list of inquiries with hard page-size caps and workspace KPI status counts.
   *
   * @param filter - Scoped query and pagination parameters.
   * @returns Paginated inquiry records, total metadata, and status breakdown counts.
   */
  public async findManyPaginated(
    filter: ListInquiriesFilter
  ): Promise<PaginatedInquiriesResult<InquiryRecord>> {
    const safePage = Math.max(1, filter.page);
    const safePageSize = Math.min(
      Math.max(1, filter.pageSize),
      PAGINATION_LIMITS.MAX_PAGE_SIZE
    );
    const skip = (safePage - 1) * safePageSize;
    const where = this.buildWhereClause(filter);
    const ownerBaseWhere: Prisma.InquiryWhereInput = filter.ownerId
      ? { ownerId: filter.ownerId }
      : {};

    const [items, total, newCount, inProgressCount, resolvedCount] =
      await this.prisma.$transaction([
        this.prisma.inquiry.findMany({
          where,
          select: INQUIRY_SELECT,
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: safePageSize,
        }),
        this.prisma.inquiry.count({ where }),
        this.prisma.inquiry.count({
          where: { ...ownerBaseWhere, status: INQUIRY_STATUS.NEW },
        }),
        this.prisma.inquiry.count({
          where: { ...ownerBaseWhere, status: INQUIRY_STATUS.IN_PROGRESS },
        }),
        this.prisma.inquiry.count({
          where: { ...ownerBaseWhere, status: INQUIRY_STATUS.RESOLVED },
        }),
      ]);

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      statusCounts: {
        total: newCount + inProgressCount + resolvedCount,
        NEW: newCount,
        IN_PROGRESS: inProgressCount,
        RESOLVED: resolvedCount,
      },
    };
  }

  /**
   * Atomically updates an inquiry's status and increments its version if expectedVersion matches.
   *
   * @param input - Status update payload including expectedVersion for optimistic concurrency.
   * @returns Updated InquiryRecord if version matched, or null if concurrent update occurred.
   */
  public async updateStatusWithVersion(
    input: UpdateInquiryStatusInput
  ): Promise<InquiryRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.InquiryUpdateManyMutationInput = {
        status: input.nextStatus,
        version: { increment: 1 },
      };

      if (input.resolutionNote !== undefined) {
        updateData.resolutionNote = input.resolutionNote;
      }

      const updateResult = await tx.inquiry.updateMany({
        where: {
          id: input.inquiryId,
          version: input.expectedVersion,
        },
        data: updateData,
      });

      if (updateResult.count === 0) {
        return null;
      }

      return tx.inquiry.findUnique({
        where: { id: input.inquiryId },
        select: INQUIRY_SELECT,
      });
    });
  }
}
