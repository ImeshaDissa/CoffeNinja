import { describe, expect, it } from 'vitest';
import {
  ERROR_CODE,
  INQUIRY_STATUS,
  USER_ROLE,
} from '../../src/constants/domain.constants.js';
import { AuthenticatedUserDto } from '../../src/domain/entities/user.entity.js';
import {
  ForbiddenError,
  InvalidStatusTransitionError,
} from '../../src/domain/errors/app-error.js';
import { InquiryAccessPolicy } from '../../src/domain/policies/inquiry-access-policy.js';
import { InquiryStateMachine } from '../../src/domain/policies/inquiry-state-machine.js';

describe('InquiryStateMachine (Domain Lifecycle Policy)', () => {
  const fsm = new InquiryStateMachine();

  it('allows forward transition from NEW to IN_PROGRESS', () => {
    expect(fsm.canTransition(INQUIRY_STATUS.NEW, INQUIRY_STATUS.IN_PROGRESS)).toBe(true);
    expect(() =>
      fsm.assertValidTransition(INQUIRY_STATUS.NEW, INQUIRY_STATUS.IN_PROGRESS)
    ).not.toThrow();
  });

  it('allows forward transition from IN_PROGRESS to RESOLVED', () => {
    expect(
      fsm.canTransition(INQUIRY_STATUS.IN_PROGRESS, INQUIRY_STATUS.RESOLVED)
    ).toBe(true);
    expect(() =>
      fsm.assertValidTransition(INQUIRY_STATUS.IN_PROGRESS, INQUIRY_STATUS.RESOLVED)
    ).not.toThrow();
  });

  it('blocks skipping directly from NEW to RESOLVED', () => {
    expect(fsm.canTransition(INQUIRY_STATUS.NEW, INQUIRY_STATUS.RESOLVED)).toBe(false);
    expect(() =>
      fsm.assertValidTransition(INQUIRY_STATUS.NEW, INQUIRY_STATUS.RESOLVED)
    ).toThrowError(InvalidStatusTransitionError);
  });

  it('blocks reopening a RESOLVED inquiry back to IN_PROGRESS or NEW', () => {
    expect(fsm.getAllowedNextStatuses(INQUIRY_STATUS.RESOLVED)).toEqual([]);

    try {
      fsm.assertValidTransition(INQUIRY_STATUS.RESOLVED, INQUIRY_STATUS.IN_PROGRESS);
      expect.fail('Expected InvalidStatusTransitionError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStatusTransitionError);
      const domainError = error as InvalidStatusTransitionError;
      expect(domainError.code).toBe(ERROR_CODE.INVALID_STATUS_TRANSITION);
      expect(domainError.statusCode).toBe(422);
    }
  });
});

describe('InquiryAccessPolicy (Ownership & Role Policy)', () => {
  const accessPolicy = new InquiryAccessPolicy();

  const aliceStaff: AuthenticatedUserDto = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'alice@coffeeninja.local',
    name: 'Alice Perera',
    role: USER_ROLE.STAFF,
  };

  const bobStaff: AuthenticatedUserDto = {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'bob@coffeeninja.local',
    name: 'Bob Silva',
    role: USER_ROLE.STAFF,
  };

  const managerUser: AuthenticatedUserDto = {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'manager@coffeeninja.local',
    name: 'Nadia Fernando',
    role: USER_ROLE.MANAGER,
  };

  it('permits STAFF user to access an inquiry they recorded', () => {
    expect(accessPolicy.canAccessInquiry(aliceStaff, aliceStaff.id)).toBe(true);
    expect(() =>
      accessPolicy.assertCanAccessInquiry(aliceStaff, aliceStaff.id)
    ).not.toThrow();
  });

  it('denies STAFF user from accessing another staff member inquiry (IDOR prevention)', () => {
    expect(accessPolicy.canAccessInquiry(aliceStaff, bobStaff.id)).toBe(false);
    expect(() =>
      accessPolicy.assertCanAccessInquiry(aliceStaff, bobStaff.id)
    ).toThrowError(ForbiddenError);
  });

  it('permits MANAGER user to access any staff member inquiry', () => {
    expect(accessPolicy.canAccessInquiry(managerUser, aliceStaff.id)).toBe(true);
    expect(accessPolicy.canAccessInquiry(managerUser, bobStaff.id)).toBe(true);
    expect(accessPolicy.resolveOwnerScope(managerUser)).toBeUndefined();
  });
});

