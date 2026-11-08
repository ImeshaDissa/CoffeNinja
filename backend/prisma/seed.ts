import { INQUIRY_STATUS, USER_ROLE } from '../src/constants/domain.constants.js';
import { getPrismaClient } from '../src/repositories/prisma/prisma-client.js';
import { BcryptPasswordHasher } from '../src/services/security/password-hasher.js';

/**
 * Deterministic UUIDs for seeded inquiries so evaluator testing and direct-link
 * access checks (Situation #3) have predictable, documented URLs.
 */
export const SEEDED_IDS = {
  ALICE_USER_ID: '11111111-1111-4111-8111-111111111111',
  BOB_USER_ID: '22222222-2222-4222-8222-222222222222',
  MANAGER_USER_ID: '33333333-3333-4333-8333-333333333333',
  ALICE_NEW_INQUIRY_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  ALICE_IN_PROGRESS_INQUIRY_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  ALICE_RESOLVED_INQUIRY_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  BOB_PRIVATE_INQUIRY_ID: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  BOB_IN_PROGRESS_INQUIRY_ID: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
} as const;

/**
 * Seeds the PostgreSQL database with staff accounts and realistic customer inquiries.
 */
async function seedDatabase(): Promise<void> {
  const prisma = getPrismaClient();
  const hasher = new BcryptPasswordHasher();

  try {
    console.log('[Seed] Hashing demo account passwords (bcrypt cost 12)...');
    const staffPasswordHash = await hasher.hash('StaffPass123!');
    const managerPasswordHash = await hasher.hash('ManagerPass123!');

    console.log('[Seed] Upserting staff & manager accounts...');
    const alice = await prisma.user.upsert({
      where: { email: 'alice@coffeeninja.local' },
      update: {
        name: 'Alice Perera (Staff)',
        passwordHash: staffPasswordHash,
        role: USER_ROLE.STAFF,
      },
      create: {
        id: SEEDED_IDS.ALICE_USER_ID,
        email: 'alice@coffeeninja.local',
        name: 'Alice Perera (Staff)',
        passwordHash: staffPasswordHash,
        role: USER_ROLE.STAFF,
      },
    });

    const bob = await prisma.user.upsert({
      where: { email: 'bob@coffeeninja.local' },
      update: {
        name: 'Bob Silva (Staff)',
        passwordHash: staffPasswordHash,
        role: USER_ROLE.STAFF,
      },
      create: {
        id: SEEDED_IDS.BOB_USER_ID,
        email: 'bob@coffeeninja.local',
        name: 'Bob Silva (Staff)',
        passwordHash: staffPasswordHash,
        role: USER_ROLE.STAFF,
      },
    });

    await prisma.user.upsert({
      where: { email: 'manager@coffeeninja.local' },
      update: {
        name: 'Nadia Fernando (Manager)',
        passwordHash: managerPasswordHash,
        role: USER_ROLE.MANAGER,
      },
      create: {
        id: SEEDED_IDS.MANAGER_USER_ID,
        email: 'manager@coffeeninja.local',
        name: 'Nadia Fernando (Manager)',
        passwordHash: managerPasswordHash,
        role: USER_ROLE.MANAGER,
      },
    });

    console.log('[Seed] Upserting sample customer inquiries...');

    await prisma.inquiry.upsert({
      where: { id: SEEDED_IDS.ALICE_NEW_INQUIRY_ID },
      update: {},
      create: {
        id: SEEDED_IDS.ALICE_NEW_INQUIRY_ID,
        customerName: 'Kavindi Jayasinghe',
        contactInfo: 'kavindi.j@example.com',
        subject: 'Commercial espresso machine calibration request',
        description:
          'Customer requested an on-site pressure and temperature calibration for two 2-group espresso machines at their Colombo 03 cafe before Friday morning.',
        resolutionNote: null,
        status: INQUIRY_STATUS.NEW,
        version: 1,
        ownerId: alice.id,
      },
    });

    await prisma.inquiry.upsert({
      where: { id: SEEDED_IDS.ALICE_IN_PROGRESS_INQUIRY_ID },
      update: {},
      create: {
        id: SEEDED_IDS.ALICE_IN_PROGRESS_INQUIRY_ID,
        customerName: 'Rohan De Mel',
        contactInfo: '+94 77 458 9210',
        subject: 'Monthly Arabica whole bean subscription delay',
        description:
          'Customer reported that their 15kg medium-roast shipment scheduled for Monday has not arrived at the Kandy branch. Checking courier tracking.',
        resolutionNote:
          'Contacted courier dispatch; shipment is at Kandy hub and scheduled for delivery by 2:00 PM today.',
        status: INQUIRY_STATUS.IN_PROGRESS,
        version: 2,
        ownerId: alice.id,
      },
    });

    await prisma.inquiry.upsert({
      where: { id: SEEDED_IDS.ALICE_RESOLVED_INQUIRY_ID },
      update: {},
      create: {
        id: SEEDED_IDS.ALICE_RESOLVED_INQUIRY_ID,
        customerName: 'Meera Ratnayake',
        contactInfo: 'meera.r@artisanbakers.lk',
        subject: 'Replacement burr grinder hopper quote',
        description:
          'Customer cracked the plastic bean hopper on their Mazzer Super Jolly grinder and asked for a replacement part invoice and availability.',
        resolutionNote:
          'Sent pro-forma invoice #INV-2048 and confirmed spare hopper was picked up by customer.',
        status: INQUIRY_STATUS.RESOLVED,
        version: 3,
        ownerId: alice.id,
      },
    });

    await prisma.inquiry.upsert({
      where: { id: SEEDED_IDS.BOB_PRIVATE_INQUIRY_ID },
      update: {},
      create: {
        id: SEEDED_IDS.BOB_PRIVATE_INQUIRY_ID,
        customerName: 'Dinesh Wijesuriya',
        contactInfo: 'dinesh@harborhotel.lk',
        subject: 'Barista training workshop for 8 hotel staff',
        description:
          'Hotel F&B manager inquired about a two-day latte art and extraction consistency workshop next month. Handled by Bob.',
        resolutionNote: null,
        status: INQUIRY_STATUS.NEW,
        version: 1,
        ownerId: bob.id,
      },
    });

    await prisma.inquiry.upsert({
      where: { id: SEEDED_IDS.BOB_IN_PROGRESS_INQUIRY_ID },
      update: {},
      create: {
        id: SEEDED_IDS.BOB_IN_PROGRESS_INQUIRY_ID,
        customerName: 'Tharindu Bandara',
        contactInfo: '+94 71 890 3344',
        subject: 'Water filtration cartridge replacement schedule',
        description:
          'Customer noticed scale build-up on steam wand and wants to check when their BWT water filter cartridge is due for replacement.',
        resolutionNote: 'Checked service log; cartridge reached 4,500L capacity. Scheduled technician visit.',
        status: INQUIRY_STATUS.IN_PROGRESS,
        version: 2,
        ownerId: bob.id,
      },
    });

    console.log('[Seed] Database seeded successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((error) => {
  console.error('[Seed] Failed to seed database:', error);
  process.exit(1);
});

