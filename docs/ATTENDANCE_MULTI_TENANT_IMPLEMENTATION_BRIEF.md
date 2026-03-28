# Attendance Platform Multi-Tenant Implementation Brief

> Purpose: give Claude Code an execution-grade spec for building the multi-tenant attendance platform in a new repo, starting from the verified single-tenant CLE baseline.

## 1. Mandatory Repo Separation

The CLE attendance repo must remain single-tenant.

- Single-tenant baseline repo: `attendanceapp`
- Verified clean commit to use as source baseline: `81d15a4`
- New multi-tenant repo: create and work only in a separate repo/folder such as `attendanceapp-multitenant`
- Do not reintroduce multi-tenant code into the CLE single-tenant branch

If Claude is operating inside the original CLE repo, it must stop and instruct the operator to switch to the new multi-tenant repo before implementing tenant logic.

## 2. Product Goal

Build a production-ready attendance platform that supports:

- multiple colleges and organizations
- multiple teachers and staff members per tenant
- students, employees, teachers, staff, HOI, admins, and superadmins
- web and Android apps with consistent branding and theme options
- tenant-isolated attendance, reports, geofence, user directory, leave, and OD workflows

This should evolve from the existing single-tenant attendance system, not be rebuilt from scratch unless a module is clearly beyond safe extension.

## 3. Starting Assumptions

Start from the cleaned single-tenant baseline that already includes:

- uniform branding improvements across web and Android
- security hardening already completed in the CLE repo
- single-tenant verification already passing

Claude should preserve those branding/security gains and layer multi-tenant support on top.

## 4. Functional Requirements

### 4.1 Tenant model

Each college or organization is a tenant.

Every tenant must have:

- `id`
- `code` or short slug, unique and human-enterable
- display name
- status: `active` or `inactive`
- theme/branding metadata
- created and updated timestamps

### 4.2 Roles

Support these roles:

- `student`
- `employee`
- `teacher`
- `staff`
- `hoi`
- `admin`
- `superadmin`

Behavioral expectations:

- `student`, `employee`, `teacher`, `staff` can mark attendance and view their own records
- `teacher` may later supervise classes or subject attendance, so do not model it as a pure alias
- `hoi` and `admin` can manage tenant-level users and reports
- `superadmin` can manage all tenants and cross-tenant setup

### 4.3 Authentication

Login must support tenant resolution.

Required behavior:

- users sign in with email plus OTP
- if the same email exists in multiple tenants, require `collegeCode` or tenant code
- auth token/session payload must include `college_id`
- all authenticated backend lookups must derive tenant scope from the verified token, not from client-submitted IDs

### 4.4 Tenant-scoped modules

Make these modules tenant-aware:

- authentication
- current user profile
- staff or member directory
- attendance punch in or out
- dashboard totals
- daily and monthly reports
- geofence or campus settings
- leave requests
- OD requests
- announcements or notifications

No tenant should be able to see or affect another tenant's data except `superadmin`.

### 4.5 Branding and themes

Continue the uniform web/mobile design work and make it tenant-aware.

Requirements:

- a shared visual system across web and Android
- 3 to 5 theme presets suitable for colleges and organizations
- tenant-specific font and palette configuration
- sensible fallback branding when a tenant does not define custom values
- same semantic color tokens and design language on web and Android

## 5. Non-Functional Requirements

### 5.1 Security

Claude must implement or preserve:

- no auth token in URL query strings
- no long-lived secrets exposed to client code
- secure token persistence strategy per platform
- rate limiting on auth routes and sensitive APIs
- server-side authorization on every write and report endpoint
- tenant scoping enforced server-side
- validation for all request bodies and query params
- safe error handling without leaking internals
- security headers where applicable on web

### 5.2 Best practices

- keep strict TypeScript
- centralize shared role and tenant helpers
- avoid duplicated scope logic across routes
- add migrations instead of hand-editing existing schema assumptions
- preserve backwards compatibility where practical during migration
- document all new environment variables and migration steps

## 6. Suggested Data Model

Claude should use or adapt these structures.

### 6.1 `att_colleges`

- `id`
- `code`
- `name`
- `status`
- `theme_key`
- `brand_font_heading`
- `brand_font_body`
- `logo_url`
- `primary_color`
- `secondary_color`
- `accent_color`
- timestamps

### 6.2 `att_users`

Add or ensure:

- `college_id` foreign key to `att_colleges`
- role constraint expanded to all required roles
- uniqueness by tenant, for example unique `(email, college_id)`

### 6.3 Tenant references on domain tables

Prefer direct `college_id` on tables where it improves query efficiency and auditability:

- attendance records
- leave requests
- od requests
- announcements
- notifications
- geofence or campus configuration

Where only `user_id` exists today, Claude may derive scope via tenant user ids initially, then add direct `college_id` if needed for performance and clarity.

## 7. Suggested Implementation Order

Claude should execute in phases and verify after each phase.

### Phase 1: foundation

- create new multi-tenant repo from commit `81d15a4`
- add a roadmap doc
- add role helper module
- add tenant helper module
- add schema migration for tenant and role expansion
- expose a config endpoint that can list active tenants for login UX

### Phase 2: authentication and identity

- update send OTP route to accept optional `collegeCode`
- update verify OTP route to resolve ambiguous emails by tenant
- include `college_id` in session/token/auth user payload
- update `me` route to return tenant metadata
- update login screens on web and mobile to support tenant code input

### Phase 3: tenant-scoped core modules

- directory or staff APIs
- dashboard overview and today views
- attendance punch route
- geofence campus route
- daily and monthly report routes

Implementation pattern:

- `superadmin` sees all
- all other roles must be constrained by `college_id`
- central helper should apply tenant scoping to DB queries

### Phase 4: extended workflows

- leave requests
- OD requests
- announcements
- notifications
- admin management screens

### Phase 5: theming and branding

- tenant-aware theme tokens
- consistent theme selector behavior on web and Android
- tenant branding in login, dashboard shell, and key screens

### Phase 6: hardening and verification

- type-check all apps
- production builds for touched apps
- audit security-sensitive flows
- seed at least two tenants with overlapping email edge cases

## 8. UI and UX Expectations

Claude should keep the product cohesive, not just functional.

Required UX details:

- login clearly explains when tenant code is needed
- tenant or college name visible in authenticated shell
- role names displayed consistently
- dashboards and reports should not contain CLE-only labels once in multi-tenant repo
- fallback themes must still look intentional and production-ready

## 9. Concrete Acceptance Criteria

The build is not done until all of these are true.

### Multi-tenant behavior

- tenant A cannot access tenant B records through any app flow or direct API parameter
- same email can exist in multiple tenants without ambiguous login success
- superadmin can create or manage tenants
- admin and HOI are limited to their own tenant

### Role behavior

- `student`, `employee`, `teacher`, and `staff` can use attendance flows
- `teacher` is first-class in types, forms, and APIs
- directory and management screens no longer assume only `staff|hoi|admin`

### Theming

- web and Android share the same theme vocabulary
- at least 3 selectable presets work correctly
- tenant branding overrides defaults without breaking layout or contrast

### Security

- auth routes are rate limited
- sensitive APIs validate and authorize on the server
- no token is appended to export URLs
- no obvious tenant breakout via query params or unchecked IDs

### Verification

Claude must run and report the relevant checks, such as:

- `api`: TypeScript checks
- `web`: production build if changed
- `mobile`: TypeScript checks and, if feasible, Expo lint or doctor

If any check cannot run, Claude must say exactly what was blocked and why.

## 10. Deliverables Claude Must Produce

- code changes in the new multi-tenant repo only
- schema migration files
- updated README and setup instructions
- a concise migration note from single-tenant to multi-tenant
- deployment-readiness status against the go-live checklist
- a final verification summary
- at least one commit after a clean verification pass

## 11. Constraints and Guardrails

- do not rewrite the whole platform if incremental change is feasible
- do not break the verified single-tenant CLE repo
- do not remove existing security improvements
- do not leave tenant scoping scattered and inconsistent
- do not hardcode one college brand into shared multi-tenant code

Deployment gate:

- Claude must use [ATTENDANCE_MULTI_TENANT_DEPLOYMENT_READINESS.md](/Users/schinchli/Documents/Projects/lms/docs/ATTENDANCE_MULTI_TENANT_DEPLOYMENT_READINESS.md) before declaring the multi-tenant repo deployable

## 12. Claude Code Execution Prompt

Use this prompt in Claude Code when starting work in the new repo:

```text
You are implementing a multi-tenant attendance platform in a new repo created from the verified single-tenant CLE baseline at commit 81d15a4. The original CLE repo must remain single-tenant only.

Your goal is to complete the first production-ready multi-tenant version with:
- multiple colleges/organizations
- roles: student, employee, teacher, staff, hoi, admin, superadmin
- tenant-aware auth using email OTP plus optional collegeCode
- tenant-scoped attendance, reports, dashboard, geofence, directory, leave, OD, and announcements
- unified branding across web and Android with 3 to 5 theme presets and tenant-level branding overrides
- security and best-practice fixes preserved or improved

Execution rules:
- Work only in the new multi-tenant repo, never in the CLE single-tenant repo
- Build incrementally, verify after each phase, and keep the app runnable
- Centralize role and tenant helpers
- Enforce tenant scoping server-side from verified auth context
- Do not trust client-submitted tenant IDs for authorization
- Keep TypeScript strict and avoid duplicated scope logic
- Update documentation as you go

Implementation order:
1. Add tenant/role foundations and migration files
2. Update auth flows and session payloads to include college_id
3. Tenant-scope core routes: directory, dashboard, attendance, reports, geofence
4. Tenant-scope leave, OD, announcements, notifications, and admin flows
5. Finish tenant-aware theming and branding on web and Android
6. Run verification and summarize remaining gaps

Definition of done:
- same email can exist in multiple tenants safely
- student/employee/teacher/staff can use attendance
- admin/HOI are tenant-limited
- superadmin can manage all tenants
- no token-in-URL behavior
- web and Android look like one product with working theme presets
- TypeScript and build checks pass for all touched apps

If a module is too large to finish in one pass, complete the highest-risk foundational work first, leave the repo in a working state, and document the exact remaining tasks.
```
