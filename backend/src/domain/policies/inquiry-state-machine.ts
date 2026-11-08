import {
  INQUIRY_STATUS,
  InquiryStatusType,
} from '../../constants/domain.constants.js';
import { InvalidStatusTransitionError } from '../errors/app-error.js';

/**
 * Declarative map of allowed forward lifecycle status transitions.
 * Open/Closed Principle: new statuses can be added to this transition matrix
 * without changing transition validation control flow.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<InquiryStatusType, readonly InquiryStatusType[]>> = {
  [INQUIRY_STATUS.NEW]: [INQUIRY_STATUS.IN_PROGRESS],
  [INQUIRY_STATUS.IN_PROGRESS]: [INQUIRY_STATUS.RESOLVED],
  [INQUIRY_STATUS.RESOLVED]: [],
};

/**
 * Encapsulates Customer Inquiry status lifecycle business rules.
 */
export class InquiryStateMachine {
  /**
   * Returns the list of valid next statuses from a given current status.
   *
   * @param currentStatus - Current status of the inquiry.
   * @returns Read-only array of permitted next statuses.
   */
  public getAllowedNextStatuses(currentStatus: InquiryStatusType): readonly InquiryStatusType[] {
    return ALLOWED_TRANSITIONS[currentStatus];
  }

  /**
   * Checks whether moving from currentStatus to targetStatus is permitted.
   *
   * @param currentStatus - Current status of the inquiry.
   * @param targetStatus - Proposed next status.
   * @returns True if the transition is valid; false otherwise.
   */
  public canTransition(
    currentStatus: InquiryStatusType,
    targetStatus: InquiryStatusType
  ): boolean {
    return ALLOWED_TRANSITIONS[currentStatus].includes(targetStatus);
  }

  /**
   * Asserts that a proposed status transition is permitted by domain rules.
   *
   * @param currentStatus - Current status of the inquiry.
   * @param targetStatus - Proposed next status.
   * @throws InvalidStatusTransitionError if the transition violates lifecycle policy.
   */
  public assertValidTransition(
    currentStatus: InquiryStatusType,
    targetStatus: InquiryStatusType
  ): void {
    if (currentStatus === targetStatus) {
      throw new InvalidStatusTransitionError(
        currentStatus,
        targetStatus,
        `Inquiry is already in ${currentStatus} status.`
      );
    }

    if (currentStatus === INQUIRY_STATUS.RESOLVED) {
      throw new InvalidStatusTransitionError(
        currentStatus,
        targetStatus,
        'Resolved inquiries are closed and cannot be reopened. Please record a new inquiry for follow-up requests.'
      );
    }

    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new InvalidStatusTransitionError(
        currentStatus,
        targetStatus,
        `Cannot transition directly from ${currentStatus} to ${targetStatus}. Move the inquiry to IN_PROGRESS first.`
      );
    }
  }
}

