# Attendance Multi-Tenant Deployment Readiness

> Status as of 2026-03-28: not ready for multi-tenant production deployment.

This document defines the minimum gates that must be satisfied before the new multi-tenant attendance repo can be treated as deployable.

## Current Verdict

The current multi-tenant attendance codebase has partial schema preparation but is not system-design complete.

It is not ready because:

- tenant identity is not carried end to end in auth/session
- sensitive APIs are not consistently tenant-scoped
- role expansion is incomplete across backend, web, and mobile
- some UX and config still assume a single institution

## Go-Live Gates

All gates below must pass.

### Gate 1: Tenant-Safe Authentication

Required:

- login supports `email + otp + optional collegeCode`
- if the same email exists in multiple tenants, login must require `collegeCode`
- auth token/session payload includes `college_id`
- authenticated user context includes `college_id`, role, and tenant metadata
- `superadmin` remains tenant-null or globally scoped by design

Must verify:

- same email in two colleges does not authenticate ambiguously
- wrong `collegeCode` cannot log a user into another tenant
- OTP verification is keyed by both email and tenant context

### Gate 2: Server-Side Tenant Isolation

Required:

- every sensitive route derives tenant scope from verified auth context
- no route trusts a client-submitted tenant id for authorization
- non-superadmin users can only read and mutate data inside their tenant
- all write flows stamp `college_id` correctly

Must cover at minimum:

- auth me
- member directory
- attendance punch
- dashboard overview and today
- daily and monthly reports
- geofence or campus settings
- leave
- OD
- announcements
- notifications
- shifts
- regularization

### Gate 3: Complete Role Model

Required roles:

- `student`
- `employee`
- `teacher`
- `staff`
- `hoi`
- `admin`
- `superadmin`

Required outcomes:

- schema constraints accept all required roles
- backend validation schemas accept all required roles where appropriate
- auth/session types include all required roles
- web and mobile types include all required roles
- UI labels and filters do not assume only `staff|hoi|admin`

### Gate 4: Database Readiness

Required:

- tenant table exists and is seeded correctly
- `att_users` is unique by `(email, college_id)` where intended
- domain tables are either directly tenant-scoped with `college_id` or safely scoped through tenant-owned `user_id`
- indexes exist on common tenant-scoped query paths
- migrations are idempotent and documented

Recommended indexes:

- `att_users(college_id, role, is_active)`
- `attendance_records(college_id, date)`
- `leave_requests(college_id, status)`
- `od_requests(college_id, status)`
- `campus_geofence(college_id)`

Must verify:

- tenant A data volume does not require cross-tenant scans for common dashboards and reports
- backfilled rows have correct `college_id`

### Gate 5: UX and Branding Readiness

Required:

- login clearly supports tenant-aware access
- authenticated shell shows tenant name
- no CLE-only copy remains in shared multi-tenant code
- web and Android use the same theme vocabulary
- at least 3 theme presets are functional
- tenant branding overrides fall back safely when missing

### Gate 6: Security Readiness

Required:

- no auth token in URL exports or query strings
- auth and sensitive routes have rate limiting
- request validation exists on all write and sensitive read endpoints
- server-side authorization checks exist on all tenant-sensitive flows
- no tenant breakout via route params, search params, or unchecked joins
- secrets are not exposed in client bundles
- web security headers are applied where applicable

### Gate 7: Verification Readiness

Required:

- API TypeScript checks pass
- web build passes if web changed
- mobile TypeScript checks pass if mobile changed
- at least one seeded two-tenant test scenario exists
- manual or automated cross-tenant access tests are documented

## Mandatory Cross-Tenant Test Scenarios

These are release blockers.

### Scenario 1: Same Email in Two Tenants

Seed:

- `alex@shared.edu` in tenant A
- `alex@shared.edu` in tenant B

Expected:

- login without `collegeCode` is rejected or requires tenant selection
- tenant A OTP cannot authenticate tenant B account
- `me` returns the correct tenant after successful login

### Scenario 2: Tenant-Isolated Reports

Seed:

- tenant A and tenant B each have attendance for the same date

Expected:

- tenant A admin daily report contains only tenant A users
- tenant B admin daily report contains only tenant B users
- `superadmin` can access both through intended administrative flow only

### Scenario 3: Geofence Isolation

Seed:

- different geofence for tenant A and tenant B

Expected:

- tenant A user cannot be validated against tenant B geofence
- punch-in reads only the user tenant geofence and approved OD scope

### Scenario 4: Directory Isolation

Expected:

- tenant admin cannot list, create into, update, or deactivate another tenant user
- `superadmin` can create tenant users deliberately with explicit tenant assignment

### Scenario 5: Leave and OD Isolation

Expected:

- approvals, pending lists, and exports only show records from the acting tenant
- cross-tenant ids in route params are rejected

## Release Rubric

Use this rubric exactly.

### Not Ready

Any of the following is true:

- token lacks `college_id`
- directory or report routes return cross-tenant data
- auth does not resolve duplicate email across tenants
- role support is incomplete in shared types
- geofence is loaded globally instead of by tenant

### Conditionally Ready for Internal QA

All of the following are true:

- auth/session carries `college_id`
- core routes are tenant-scoped
- duplicate-email login edge case is handled
- role model is complete in backend and clients
- checks pass

But any of these may still remain:

- some extended admin workflows incomplete
- limited automation coverage
- branding polish still in progress

### Ready for Production Rollout

All gates 1 through 7 pass and:

- at least two real tenants are validated in staging
- cross-tenant manual tests are signed off
- deployment and rollback steps are documented
- monitoring and incident response ownership are clear

## Claude Code Execution Notes

Claude should treat this as a stoplight checklist.

- If any `Not Ready` condition exists, Claude must say the repo is not deployable.
- Claude should complete foundational isolation work before cosmetic tasks.
- Claude should not declare the repo multi-tenant-ready based only on schema changes.
- Claude must report exact remaining blockers at the end of each implementation pass.

## Recommended Final Signoff Output

When Claude finishes a pass, it should summarize deployment posture like this:

```text
Deployment posture: Not Ready / Internal QA Ready / Production Ready

Passed gates:
- ...

Failed gates:
- ...

Highest-risk blocker:
- ...

Next required work:
1. ...
2. ...
3. ...
```
