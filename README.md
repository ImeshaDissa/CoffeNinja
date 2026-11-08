# Coffee Ninja — Customer Inquiry Management System

Full-stack web application enabling staff members to sign in, capture customer inquiries, filter/search records, and move inquiries safely through their resolution lifecycle (`New` → `In Progress` → `Resolved`).

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (`strict: true`), Tailwind CSS
- **Backend**: Node.js, Express 4, TypeScript (`strict: true`), Zod, Helmet, Bcrypt (`cost 12`), JWT (`httpOnly` cookies)
- **Database**: PostgreSQL with Prisma ORM (migrations + deterministic seeding)
- **Testing**: Vitest, Supertest (Backend API & domain policy tests), React Testing Library (Frontend UI & interaction tests)

---

## Quick Local Setup

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Copy the example environment files in both packages:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Start PostgreSQL

Choose **any one** of the three options below:

- **Option A — Built-in Prisma Local PostgreSQL (Zero external install required)**:
  ```bash
  npm run db:postgres
  ```
  Set `DATABASE_URL` in `backend/.env` to:
  ```env
  DATABASE_URL="postgres://postgres:postgres@localhost:5432/template1?sslmode=disable&connection_limit=1&pgbouncer=true"
  ```
- **Option B — Local PostgreSQL Installation**:
  Create a `coffee_ninja` database and point `DATABASE_URL` in `backend/.env` to `postgresql://<user>:<password>@localhost:5432/coffee_ninja?schema=public`.
- **Option C — Docker Compose**:
  ```bash
  docker compose up -d
  ```

### 4. Apply Migrations & Seed Demo Data

From the repository root:

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run Backend & Frontend Servers

Open two terminals from the repository root:

```bash
# Terminal 1 — Express API on http://localhost:4000
npm run dev:backend

# Terminal 2 — Next.js Web App on http://localhost:3000
npm run dev:frontend
```

Open **http://localhost:3000** in your browser.

---

## Seeded Staff Accounts

| Name | Email | Password | Role & Access Rule |
| :--- | :--- | :--- | :--- |
| **Alice Perera** | `alice@coffeeninja.local` | `StaffPass123!` | `STAFF` — Views & updates **only inquiries recorded by Alice** |
| **Bob Silva** | `bob@coffeeninja.local` | `StaffPass123!` | `STAFF` — Views & updates **only inquiries recorded by Bob** |
| **Nadia Fernando** | `manager@coffeeninja.local` | `ManagerPass123!` | `MANAGER` — Views & updates **all staff inquiries** |

---

## Demonstrating the Three Real-World Situations

1. **Missing, Invalid, or Duplicate Customer Input**:
   - Click **Record Inquiry** and submit empty fields or an invalid contact (e.g. `not-an-email`): the UI guides you with inline field errors, and `POST /api/v1/inquiries` independently rejects bad payloads via strict Zod schemas (`400 Bad Request`).
   - Submitting an active duplicate `(contactInfo, subject)` returns `409 DUPLICATE_INQUIRY` with a direct button to open the existing inquiry.
2. **Stale Data Across Two Browser Tabs**:
   - Sign in as `alice@coffeeninja.local` and open the same `New` inquiry in **Tab 1** and **Tab 2** (disable window-focus sync or keep both visible side-by-side).
   - In **Tab 1**, click **Mark as In Progress** (`version` increments from `v1` to `v2`).
   - In **Tab 2** (still holding stale `v1`), click **Mark as In Progress**: the API rejects the stale write (`409 STALE_DATA`), and Tab 2 displays a clear warning banner while refreshing its UI to `v2`.
3. **Direct Link to an Unauthorized Inquiry**:
   - While signed in as **Alice (`STAFF`)**, navigate directly to Bob's seeded inquiry:
     `http://localhost:3000/inquiries/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1` (or click the verification shortcut at the bottom of Alice's dashboard).
   - The Express API enforces object-level authorization (`403 Forbidden`), and the UI displays a predictable **Access Restricted** state.

---

## Running Tests & Testing Gaps

Run both backend and frontend test suites from the root directory:

```bash
npm test
```

- **Backend Tests (`backend/tests/`)**:
  - `unit/inquiry-domain.test.ts`: Verifies `InquiryStateMachine` transitions (`NEW` → `IN_PROGRESS` → `RESOLVED`, blocking `NEW` → `RESOLVED` and reopening `RESOLVED`) and `InquiryAccessPolicy` ownership/manager rules.
  - `integration/inquiry.api.test.ts`: Exercises Express routes via Supertest for `401` unauthenticated requests, `httpOnly` cookie login without leaking `passwordHash`, `400` validation errors, `409` duplicate detection, `409` optimistic concurrency conflicts, `403` cross-staff IDOR prevention, and `400`/`404` invalid/missing UUIDs.
- **Frontend Tests (`frontend/src/__tests__/`)**:
  - `InquiryDashboard.test.tsx`: Verifies the 4 KPI summary cards, click-to-filter interaction, and Light/Dark theme switcher.
  - `InquiryForm.test.tsx`: Verifies client-side validation guidance, valid inquiry submission, and `409 DUPLICATE_INQUIRY` alert rendering.
  - `InquiryDetail.test.tsx`: Verifies status transitions with progress notes, `409 STALE_DATA` conflict banner + UI refresh, and `403 Forbidden` screen rendering.
- **Known Testing Gaps**:
  - Backend HTTP integration tests inject `InMemoryInquiryRepository` / `InMemoryUserRepository` (Liskov-compliant implementations of `IInquiryRepository` / `IUserRepository`) so CI runs fast and deterministically without wiping a developer's database; full browser-to-Postgres E2E tests (e.g., Playwright) and load/rate-limit threshold tests are not yet automated.
