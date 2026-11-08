import { USER_ROLE } from '../../constants/domain.constants.js';
import { AuthenticatedUserDto } from '../entities/user.entity.js';
import { ForbiddenError } from '../errors/app-error.js';

/**
 * Encapsulates Ownership and Role-Based Access Control (RBAC) policies for inquiries.
 *
 * Policy:
 * - MANAGER role can view and update any inquiry across the business.
 * - STAFF role can only view and update inquiries they recorded (ownerId === actor.id).
 */
export class InquiryAccessPolicy {
  /**
   * Determines whether an authenticated actor has global inquiry visibility.
   *
   * @param actor - Currently authenticated user.
   * @returns True if the actor can view all staff inquiries; false if scoped to own records.
   */
  public canAccessAllInquiries(actor: AuthenticatedUserDto): boolean {
    return actor.role === USER_ROLE.MANAGER;
  }

  /**
   * Returns the ownerId filter that must be applied when listing inquiries for an actor.
   *
   * @param actor - Currently authenticated user.
   * @returns The actor's user ID for STAFF users, or undefined for MANAGER users.
   */
  public resolveOwnerScope(actor: AuthenticatedUserDto): string | undefined {
    return this.canAccessAllInquiries(actor) ? undefined : actor.id;
  }

  /**
   * Checks whether an authenticated actor is permitted to access a specific inquiry.
   *
   * @param actor - Currently authenticated user.
   * @param inquiryOwnerId - User ID of the staff member who owns the inquiry.
   * @returns True if permitted; false otherwise.
   */
  public canAccessInquiry(actor: AuthenticatedUserDto, inquiryOwnerId: string): boolean {
    if (this.canAccessAllInquiries(actor)) {
      return true;
    }
    return actor.id === inquiryOwnerId;
  }

  /**
   * Enforces object-level authorization for a target inquiry record.
   *
   * @param actor - Currently authenticated user.
   * @param inquiryOwnerId - User ID of the staff member who owns the inquiry.
   * @throws ForbiddenError when the actor is not authorized for the record.
   */
  public assertCanAccessInquiry(actor: AuthenticatedUserDto, inquiryOwnerId: string): void {
    if (!this.canAccessInquiry(actor, inquiryOwnerId)) {
      throw new ForbiddenError(
        'Access denied: Staff members may only view and update inquiries they recorded.'
      );
    }
  }
}

