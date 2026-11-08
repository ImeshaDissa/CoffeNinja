import {
  ERROR_CODE,
  InquiryStatusType,
} from '../constants/domain.constants.js';
import {
  InquiryDto,
  InquiryRecord,
  PaginatedInquiriesResult,
} from '../domain/entities/inquiry.entity.js';
import { AuthenticatedUserDto } from '../domain/entities/user.entity.js';
import {
  ConflictError,
  NotFoundError,
} from '../domain/errors/app-error.js';
import { InquiryAccessPolicy } from '../domain/policies/inquiry-access-policy.js';
import { InquiryStateMachine } from '../domain/policies/inquiry-state-machine.js';
import { IInquiryRepository } from '../repositories/interfaces/inquiry-repository.interface.js';

/**
 * Command payload for recording a new customer inquiry.
 */
export interface CreateInquiryCommand {
  readonly customerName: string;
  readonly contactInfo: string;
  readonly subject: string;
  readonly description: string;
}

/**
 * Query payload for listing customer inquiries.
 */
export interface ListInquiriesQuery {
  readonly status?: InquiryStatusType;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Command payload for transitioning an inquiry's status.
 */
export interface TransitionInquiryStatusCommand {
  readonly inquiryId: string;
  readonly status: InquiryStatusType;
  readonly expectedVersion: number;
  readonly resolutionNote?: string | null;
}

/**
 * Service contract for Customer Inquiry business operations.
 */
export interface IInquiryService {
  /**
   * Records a new customer inquiry on behalf of the authenticated staff member.
   *
   * @param actor - Authenticated staff user creating the inquiry.
   * @param command - Validated customer inquiry payload.
   * @returns Newly created InquiryDto.
   */
  createInquiry(
    actor: AuthenticatedUserDto,
    command: CreateInquiryCommand
  ): Promise<InquiryDto>;

  /**
   * Lists inquiries visible to the authenticated staff member with filtering and pagination.
   *
   * @param actor - Authenticated staff user requesting the overview.
   * @param query - Validated filter, search, and pagination options.
   * @returns Paginated list of InquiryDto objects.
   */
  listInquiries(
    actor: AuthenticatedUserDto,
    query: ListInquiriesQuery
  ): Promise<PaginatedInquiriesResult<InquiryDto>>;

  /**
   * Retrieves a single inquiry by ID after verifying object-level authorization.
   *
   * @param actor - Authenticated staff user requesting the record.
   * @param inquiryId - Target inquiry UUID.
   * @returns Authorized InquiryDto.
   */
  getInquiryById(actor: AuthenticatedUserDto, inquiryId: string): Promise<InquiryDto>;

  /**
   * Transitions an inquiry's status while enforcing authorization, FSM rules, and optimistic locking.
   *
   * @param actor - Authenticated staff user performing the status transition.
   * @param command - Validated transition command including expectedVersion.
   * @returns Updated InquiryDto.
   */
  transitionInquiryStatus(
    actor: AuthenticatedUserDto,
    command: TransitionInquiryStatusCommand
  ): Promise<InquiryDto>;
}

/**
 * Orchestrates Customer Inquiry creation, scoped retrieval, lifecycle transitions, and concurrency safety.
 */
export class InquiryService implements IInquiryService {
  private readonly inquiryRepository: IInquiryRepository;
  private readonly stateMachine: InquiryStateMachine;
  private readonly accessPolicy: InquiryAccessPolicy;

  /**
   * Initializes InquiryService with injected repository and domain policy dependencies.
   *
   * @param inquiryRepository - Inquiry persistence abstraction.
   * @param stateMachine - Inquiry lifecycle state machine policy.
   * @param accessPolicy - Inquiry ownership and role authorization policy.
   */
  constructor(
    inquiryRepository: IInquiryRepository,
    stateMachine: InquiryStateMachine,
    accessPolicy: InquiryAccessPolicy
  ) {
    this.inquiryRepository = inquiryRepository;
    this.stateMachine = stateMachine;
    this.accessPolicy = accessPolicy;
  }

  /**
   * Maps an internal InquiryRecord into a public InquiryDto enriched with allowed next transitions.
   *
   * @param record - Persistence inquiry record.
   * @returns Serialized InquiryDto.
   */
  private toInquiryDto(record: InquiryRecord): InquiryDto {
    return {
      id: record.id,
      customerName: record.customerName,
      contactInfo: record.contactInfo,
      subject: record.subject,
      description: record.description,
      resolutionNote: record.resolutionNote,
      status: record.status,
      version: record.version,
      ownerId: record.ownerId,
      owner: {
        id: record.owner.id,
        name: record.owner.name,
        email: record.owner.email,
      },
      allowedTransitions: this.stateMachine.getAllowedNextStatuses(record.status),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Records a new customer inquiry after verifying no active duplicate exists for the same contact and subject.
   *
   * @param actor - Authenticated staff member recording the inquiry.
   * @param command - Validated customer inquiry payload.
   * @returns Newly persisted InquiryDto.
   * @throws ConflictError when an unresolved duplicate inquiry already exists.
   */
  public async createInquiry(
    actor: AuthenticatedUserDto,
    command: CreateInquiryCommand
  ): Promise<InquiryDto> {
    const existingDuplicate = await this.inquiryRepository.findActiveDuplicate(
      command.contactInfo,
      command.subject
    );

    if (existingDuplicate) {
      const canViewDuplicate = this.accessPolicy.canAccessInquiry(
        actor,
        existingDuplicate.ownerId
      );

      throw new ConflictError(
        'An unresolved inquiry with the same customer contact and subject already exists.',
        ERROR_CODE.DUPLICATE_INQUIRY,
        canViewDuplicate
          ? { existingInquiryId: existingDuplicate.id, status: existingDuplicate.status }
          : { status: existingDuplicate.status }
      );
    }

    const created = await this.inquiryRepository.create({
      customerName: command.customerName.trim(),
      contactInfo: command.contactInfo.trim(),
      subject: command.subject.trim(),
      description: command.description.trim(),
      ownerId: actor.id,
    });

    return this.toInquiryDto(created);
  }

  /**
   * Lists inquiries scoped to the actor's role (own inquiries for STAFF, all inquiries for MANAGER).
   *
   * @param actor - Authenticated staff user.
   * @param query - Filter, search, and pagination options.
   * @returns Paginated result of InquiryDto objects.
   */
  public async listInquiries(
    actor: AuthenticatedUserDto,
    query: ListInquiriesQuery
  ): Promise<PaginatedInquiriesResult<InquiryDto>> {
    const ownerScope = this.accessPolicy.resolveOwnerScope(actor);

    const paginated = await this.inquiryRepository.findManyPaginated({
      ownerId: ownerScope,
      status: query.status,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: paginated.items.map((item) => this.toInquiryDto(item)),
      total: paginated.total,
      page: paginated.page,
      pageSize: paginated.pageSize,
      totalPages: paginated.totalPages,
      statusCounts: paginated.statusCounts,
    };
  }

  /**
   * Retrieves a single inquiry by ID and enforces object-level access control.
   *
   * @param actor - Authenticated staff user.
   * @param inquiryId - Target inquiry UUID.
   * @returns Authorized InquiryDto.
   * @throws NotFoundError when no inquiry exists with the provided ID.
   * @throws ForbiddenError when the actor does not own the inquiry and is not a MANAGER.
   */
  public async getInquiryById(
    actor: AuthenticatedUserDto,
    inquiryId: string
  ): Promise<InquiryDto> {
    const record = await this.inquiryRepository.findById(inquiryId);
    if (!record) {
      throw new NotFoundError('The requested inquiry does not exist or may have been removed.');
    }

    this.accessPolicy.assertCanAccessInquiry(actor, record.ownerId);

    return this.toInquiryDto(record);
  }

  /**
   * Updates an inquiry's status while enforcing ownership, valid state transitions, and optimistic concurrency.
   *
   * @param actor - Authenticated staff user.
   * @param command - Status transition payload including expectedVersion.
   * @returns Updated InquiryDto.
   * @throws NotFoundError when the inquiry no longer exists.
   * @throws ForbiddenError when the actor lacks permission for the inquiry.
   * @throws ConflictError when expectedVersion is stale due to a concurrent update in another tab/session.
   * @throws InvalidStatusTransitionError when the requested transition violates FSM rules.
   */
  public async transitionInquiryStatus(
    actor: AuthenticatedUserDto,
    command: TransitionInquiryStatusCommand
  ): Promise<InquiryDto> {
    const existing = await this.inquiryRepository.findById(command.inquiryId);
    if (!existing) {
      throw new NotFoundError('Cannot update inquiry because it no longer exists.');
    }

    this.accessPolicy.assertCanAccessInquiry(actor, existing.ownerId);

    if (existing.version !== command.expectedVersion) {
      throw new ConflictError(
        'This inquiry was updated in another tab or session. Your view has been refreshed with the latest status.',
        ERROR_CODE.STALE_DATA,
        { latestInquiry: this.toInquiryDto(existing) }
      );
    }

    this.stateMachine.assertValidTransition(existing.status, command.status);

    const normalizedNote =
      command.resolutionNote !== undefined
        ? command.resolutionNote === null || command.resolutionNote.trim() === ''
          ? null
          : command.resolutionNote.trim()
        : undefined;

    const updated = await this.inquiryRepository.updateStatusWithVersion({
      inquiryId: command.inquiryId,
      nextStatus: command.status,
      expectedVersion: command.expectedVersion,
      resolutionNote: normalizedNote,
    });

    if (!updated) {
      const latestAfterRace = await this.inquiryRepository.findById(command.inquiryId);
      if (!latestAfterRace) {
        throw new NotFoundError('Cannot update inquiry because it no longer exists.');
      }

      throw new ConflictError(
        'This inquiry was updated concurrently by another request. Please review the latest status.',
        ERROR_CODE.STALE_DATA,
        { latestInquiry: this.toInquiryDto(latestAfterRace) }
      );
    }

    return this.toInquiryDto(updated);
  }
}

