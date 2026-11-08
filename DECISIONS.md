# Engineering Decisions (`DECISIONS.md`)

## 1. Key Assumptions
- **Internal Staff Workspace**: Accounts represent pre-provisioned employees (`STAFF` and `MANAGER`), so self-registration and password-reset email flows are intentionally out of scope.
- **Single Contact Field Flexibility**: Small service businesses receive inquiries via both phone/WhatsApp and email. Rather than forcing two separate optional inputs, `contactInfo` accepts either a validated email address or a phone number (7–15 digits).
- **One Additional Workflow Field (`resolutionNote`)**: The brief permits one extra field if it clearly improves the workflow. Adding `resolutionNote` directly addresses the prompt's core problem statement (*"Staff sometimes lose track of... what happened last"*) by letting staff record brief context when moving an inquiry to `In Progress` or `Resolved`.

---

## 2. Meaningful Design Choices

### A. Ownership & Access Control: Creator Scope + Manager Oversight
- **Decision**: `STAFF` members (`alice`, `bob`) can only list, view, and update inquiries they recorded (`ownerId === actor.id`), while `MANAGER` users (`manager`) have full visibility across all inquiries.
- **Why**: Giving every employee access to every customer's contact details violates least privilege and makes it impossible to demonstrate server-side access rejection when a staff member opens a direct URL to a colleague's inquiry (Real-World Situation #3). Scoping list queries and verifying `InquiryAccessPolicy` in `InquiryService` prevents Insecure Direct Object Reference (IDOR) vulnerabilities regardless of UI behavior.

### B. Strict Forward Lifecycle State Machine (`InquiryStateMachine`)
- **Decision**: Inquiries move strictly forward: `NEW` → `IN_PROGRESS` → `RESOLVED`. Skipping from `NEW` directly to `RESOLVED` is disallowed, and `RESOLVED` is terminal (cannot be reopened).
- **Why**: Requiring `IN_PROGRESS` before `RESOLVED` ensures a staff member explicitly claims/handles an inquiry before closing it. Keeping `RESOLVED` immutable preserves historical reliability; if a customer follows up weeks later, recording a new inquiry avoids muddying whether an older request was neglected. Invalid transitions return `422 Unprocessable Entity` (`INVALID_STATUS_TRANSITION`).

### C. Duplicate Input Policy Without Over-Engineering
- **Decision**: Before creating a new inquiry, `InquiryService` checks for an existing unresolved (`NEW` or `IN_PROGRESS`) inquiry with the same case-insensitive `(contactInfo, subject)`. If found, the API returns `409 Conflict` (`DUPLICATE_INQUIRY`) along with `existingInquiryId` (when accessible to the caller) so the UI can link straight to it. Once an inquiry is `RESOLVED`, the same customer can submit a future request with the same subject without friction.

---

## 3. Accepted Trade-Off: Stale Data & Multi-Tab Concurrency
- **Choice**: Optimistic Concurrency Control (`version` integer column checked atomically in `PrismaInquiryRepository.updateStatusWithVersion` via `updateMany WHERE id = ? AND version = ?`) paired with window-focus background refresh.
- **Trade-Off Accepted**: Unlike WebSockets or Server-Sent Events (SSE), a background tab does not update visually at the exact millisecond another tab saves—unless the user focuses the tab or clicks a transition button. However, **data integrity is 100% preserved**: a stale tab can never silently overwrite a newer status or note. Instead, the server responds with `409 STALE_DATA` containing `latestInquiry`, allowing the UI to explain the conflict and sync immediately without WebSocket infrastructure complexity.

---

## 4. SOLID Architecture & Security Hardening
- **SOLID Separation**: Controllers handle HTTP transport only; Services (`AuthService`, `InquiryService`) depend on repository and security interfaces (`IInquiryRepository`, `IUserRepository`, `IPasswordHasher`, `ITokenService`) injected via `container.ts`; pure domain policies (`InquiryStateMachine`, `InquiryAccessPolicy`) contain zero framework or ORM imports.
- **Defense in Depth**: All inputs pass through `.strict()` Zod schemas (blocking mass assignment), passwords use `bcrypt` (cost 12) with dummy-hash verification on unknown emails to mitigate timing enumeration, sessions use `httpOnly` `SameSite=Lax` JWT cookies with pinned `HS256` / `iss` / `aud` claims, and Prisma queries use explicit `select` projections so `passwordHash` can never leak.

---

## 5. Use of AI & Outside Resources
- **Where AI Helped**: AI assisted with scaffolding boilerplate TypeScript interfaces, drafting initial Tailwind UI layout classes, and structuring Vitest/Supertest test harnesses.
- **Suggestion Changed / Rejected**:
  - *Rejected*: An initial pattern of storing the JWT in `localStorage` and hiding unauthorized links only in React was rejected because `localStorage` exposes session tokens to XSS and frontend-only checks fail direct-URL authorization. We instead implemented `httpOnly` cookies + Express auth middleware + service-layer `InquiryAccessPolicy`.
  - *Changed*: Instead of allowing unrestricted `status` updates (`prisma.inquiry.update({ where: { id }, data: req.body })`), we replaced direct updates with explicit Zod DTO whitelisting, `InquiryStateMachine` validation, and transactional `version`-checked optimistic locking.

---

## 6. What We Would Improve Next
1. **Append-Only Audit Trail (`inquiry_events` table)**: Record every status transition and note edit with `actorId` and timestamp rather than storing only the latest `resolutionNote`.
2. **Controlled Inquiry Reassignment**: Allow a `MANAGER` to reassign an inquiry from an unavailable staff member to another `STAFF` member.
3. **End-to-End Browser Suite**: Add Playwright tests running against an ephemeral PostgreSQL test database in CI.

