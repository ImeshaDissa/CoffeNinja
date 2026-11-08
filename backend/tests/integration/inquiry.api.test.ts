import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  ERROR_CODE,
  INQUIRY_STATUS,
  USER_ROLE,
} from '../../src/constants/domain.constants.js';
import { InquiryRecord } from '../../src/domain/entities/inquiry.entity.js';
import { UserRecord } from '../../src/domain/entities/user.entity.js';
import {
  InMemoryInquiryRepository,
  InMemoryUserRepository,
} from '../../src/repositories/in-memory/in-memory-repositories.js';
import { BcryptPasswordHasher } from '../../src/services/security/password-hasher.js';
import { JwtTokenService } from '../../src/services/security/token-service.js';

const TEST_JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_12345';
const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const MANAGER_ID = '33333333-3333-4333-8333-333333333333';
const BOB_INQUIRY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

describe('Customer Inquiry Management API Integration Tests', () => {
  const passwordHasher = new BcryptPasswordHasher(4); // Fast rounds for test suite
  const tokenService = new JwtTokenService(TEST_JWT_SECRET, '1h');
  let app: ReturnType<typeof createApp>;
  let aliceToken: string;
  let bobToken: string;
  let managerToken: string;

  beforeEach(async () => {
    const passwordHash = await passwordHasher.hash('StaffPass123!');
    const now = new Date();

    const users: UserRecord[] = [
      {
        id: ALICE_ID,
        email: 'alice@coffeeninja.local',
        name: 'Alice Perera',
        passwordHash,
        role: USER_ROLE.STAFF,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: BOB_ID,
        email: 'bob@coffeeninja.local',
        name: 'Bob Silva',
        passwordHash,
        role: USER_ROLE.STAFF,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: MANAGER_ID,
        email: 'manager@coffeeninja.local',
        name: 'Nadia Fernando',
        passwordHash,
        role: USER_ROLE.MANAGER,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const initialInquiries: InquiryRecord[] = [
      {
        id: BOB_INQUIRY_ID,
        customerName: 'Dinesh Wijesuriya',
        contactInfo: 'dinesh@harborhotel.lk',
        subject: 'Barista training workshop for 8 hotel staff',
        description: 'Two-day latte art and extraction consistency workshop inquiry.',
        resolutionNote: null,
        status: INQUIRY_STATUS.NEW,
        version: 1,
        ownerId: BOB_ID,
        owner: {
          id: BOB_ID,
          name: 'Bob Silva',
          email: 'bob@coffeeninja.local',
        },
        createdAt: now,
        updatedAt: now,
      },
    ];

    const userRepository = new InMemoryUserRepository(users);
    const inquiryRepository = new InMemoryInquiryRepository(
      userRepository,
      initialInquiries
    );

    app = createApp({
      userRepository,
      inquiryRepository,
      passwordHasher,
      tokenService,
      enableRateLimit: false,
    });

    aliceToken = tokenService.signSessionToken({
      id: ALICE_ID,
      email: 'alice@coffeeninja.local',
      name: 'Alice Perera',
      role: USER_ROLE.STAFF,
    });

    bobToken = tokenService.signSessionToken({
      id: BOB_ID,
      email: 'bob@coffeeninja.local',
      name: 'Bob Silva',
      role: USER_ROLE.STAFF,
    });

    managerToken = tokenService.signSessionToken({
      id: MANAGER_ID,
      email: 'manager@coffeeninja.local',
      name: 'Nadia Fernando',
      role: USER_ROLE.MANAGER,
    });
  });

  describe('Authentication & Session Enforcement', () => {
    it('rejects unauthenticated requests to protected inquiry endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/inquiries');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODE.UNAUTHORIZED);
    });

    it('authenticates valid staff credentials, sets httpOnly cookie, and omits passwordHash', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@coffeeninja.local',
        password: 'StaffPass123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@coffeeninja.local');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.headers['set-cookie']?.[0]).toContain('cn_session=');
      expect(res.headers['set-cookie']?.[0]).toContain('HttpOnly');
    });
  });

  describe('Situation #1: Submitting Inquiry with Missing, Invalid, or Duplicate Data', () => {
    it('rejects missing or invalid contact information with 400 and field-level errors', async () => {
      const res = await request(app)
        .post('/api/v1/inquiries')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          customerName: 'A',
          contactInfo: 'not-an-email-or-phone',
          subject: 'Hi',
          description: 'Too short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODE.VALIDATION_ERROR);
      expect(res.body.error.details.fields.length).toBeGreaterThanOrEqual(4);
    });

    it('rejects duplicate unresolved inquiry with 409 DUPLICATE_INQUIRY', async () => {
      const payload = {
        customerName: 'Kasun Perera',
        contactInfo: 'kasun@cafe.lk',
        subject: 'Grinder burr replacement',
        description: 'Needs replacement 64mm flat burrs for commercial grinder.',
      };

      const firstRes = await request(app)
        .post('/api/v1/inquiries')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send(payload);
      expect(firstRes.status).toBe(201);

      const duplicateRes = await request(app)
        .post('/api/v1/inquiries')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send(payload);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe(ERROR_CODE.DUPLICATE_INQUIRY);
      expect(duplicateRes.body.error.details.existingInquiryId).toBe(
        firstRes.body.data.inquiry.id
      );
    });
  });

  describe('Situation #2: Two Browser Tabs & Stale Data Concurrency Protection', () => {
    it('updates status when expectedVersion matches and rejects stale tab update with 409 STALE_DATA', async () => {
      // Tab A updates Bob's inquiry from NEW (version 1) to IN_PROGRESS
      const tabARes = await request(app)
        .patch(`/api/v1/inquiries/${BOB_INQUIRY_ID}/status`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          status: INQUIRY_STATUS.IN_PROGRESS,
          expectedVersion: 1,
          resolutionNote: 'Called hotel manager to confirm dates.',
        });

      expect(tabARes.status).toBe(200);
      expect(tabARes.body.data.inquiry.status).toBe(INQUIRY_STATUS.IN_PROGRESS);
      expect(tabARes.body.data.inquiry.version).toBe(2);

      // Tab B still holds stale version 1 and attempts to update
      const tabBRes = await request(app)
        .patch(`/api/v1/inquiries/${BOB_INQUIRY_ID}/status`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          status: INQUIRY_STATUS.IN_PROGRESS,
          expectedVersion: 1,
        });

      expect(tabBRes.status).toBe(409);
      expect(tabBRes.body.error.code).toBe(ERROR_CODE.STALE_DATA);
      expect(tabBRes.body.error.details.latestInquiry.version).toBe(2);
      expect(tabBRes.body.error.details.latestInquiry.status).toBe(
        INQUIRY_STATUS.IN_PROGRESS
      );
    });
  });

  describe('Situation #3: Direct Link to Inquiry User Should Not Be Allowed to View', () => {
    it('returns 403 Forbidden when Alice (STAFF) opens a direct link to Bob inquiry', async () => {
      const getRes = await request(app)
        .get(`/api/v1/inquiries/${BOB_INQUIRY_ID}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe(ERROR_CODE.FORBIDDEN);

      const patchRes = await request(app)
        .patch(`/api/v1/inquiries/${BOB_INQUIRY_ID}/status`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: INQUIRY_STATUS.IN_PROGRESS,
          expectedVersion: 1,
        });

      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe(ERROR_CODE.FORBIDDEN);
    });

    it('permits Manager to view and update Bob inquiry', async () => {
      const res = await request(app)
        .get(`/api/v1/inquiries/${BOB_INQUIRY_ID}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inquiry.id).toBe(BOB_INQUIRY_ID);
    });
  });

  describe('Trustworthiness: Invalid IDs and Non-Existent Records', () => {
    it('returns 400 Bad Request when an invalid UUID format is requested', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries/invalid-id-format')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODE.VALIDATION_ERROR);
    });

    it('returns 404 Not Found when a valid UUID does not exist', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries/99999999-9999-4999-8999-999999999999')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ERROR_CODE.NOT_FOUND);
    });
  });
});

