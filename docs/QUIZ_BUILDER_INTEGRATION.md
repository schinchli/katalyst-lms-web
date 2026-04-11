# Quiz Builder + Orders Integration — Documentation

**Version:** 1.0  
**Date:** 2026-04-10  
**Branch:** feature/task-2-event-driven-leaderboard → codex/unified-theme-admin-sync

---

## Overview

Full end-to-end admin system: create quizzes → sell as products → orders tracked on every payment.

---

## Architecture

```
Admin creates quiz via UI
        ↓
/api/admin/quiz-builder (POST)
        ↓
app_settings.managed_quiz_content (Supabase JSON blob)
        ↓
/api/quiz-content → buildManagedQuizDataset() merges with quizzes.ts
        ↓
Users see quiz in catalog → purchase via Razorpay/Stripe
        ↓
/api/payment/verify → inserts into purchases + orders tables
        ↓
Admin sees in /dashboard/admin/orders
```

---

## Admin Pages

| URL | Purpose |
|-----|---------|
| `/dashboard/admin` | Hub with quick-links to all admin sections |
| `/dashboard/admin/quiz-builder` | Create/edit/delete quizzes + questions |
| `/dashboard/admin/products` | Full catalog (built-in + managed), search, filter |
| `/dashboard/admin/orders` | Paginated order history, status filter |
| `/dashboard/admin/orders/[orderId]` | Single order detail view |
| `/dashboard/admin/customers` | User accounts |
| `/dashboard/admin/reviews` | Moderation queue + aggregate stats |
| `/dashboard/admin/ecommerce` | Sales dashboard |

---

## API Routes

### Quiz Builder

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/quiz-builder` | Merged catalog (built-in + managed) |
| POST | `/api/admin/quiz-builder` | Create a new managed quiz |
| PATCH | `/api/admin/quiz-builder/[quizId]` | Update quiz metadata |
| DELETE | `/api/admin/quiz-builder/[quizId]` | Delete managed quiz (built-ins → 409) |
| GET | `/api/admin/quiz-builder/[quizId]/questions` | Fetch questions |
| PUT | `/api/admin/quiz-builder/[quizId]/questions` | Full replace questions |

All routes: Bearer token auth → admin email check → rate limited.

### Orders

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/orders` | Paginated orders list |
| GET | `/api/admin/orders/[orderId]` | Single order detail |

---

## Database Schema

### `orders` table (new — migration 010)
```sql
id                     UUID PK
user_id                UUID → auth.users
quiz_id                TEXT
quiz_title             TEXT
amount                 INTEGER (paise)
currency               TEXT
gateway                TEXT  -- 'razorpay' | 'stripe'
status                 TEXT  -- 'completed' | 'pending' | 'failed'
purchase_type          TEXT  -- 'course' | 'subscription'
plan                   TEXT  -- 'annual' | 'monthly'
user_name              TEXT  -- denormalized
user_email             TEXT  -- denormalized
razorpay_payment_id    TEXT  UNIQUE
stripe_session_id      TEXT  UNIQUE
metadata               JSONB
created_at / updated_at TIMESTAMPTZ
```

**RLS:** Users read own records only. Service role writes (no client-side inserts).

### `purchases` table backfill (migration 010)
Added columns: `quiz_id`, `gateway`, `currency`, `status`, `user_email`, `razorpay_payment_id`, `razorpay_order_id`, `stripe_session_id`, `stripe_payment_intent`.

---

## Quiz Data Flow

### Built-in quizzes (from `quizzes.ts`)
- Hardcoded, always present, cannot be deleted via API
- Metadata can be overridden via PATCH → creates a managed overlay entry
- Source badge: `BUILT-IN`

### Managed quizzes (from `app_settings.managed_quiz_content`)
- Created via Quiz Builder admin UI or POST `/api/admin/quiz-builder`
- Stored as JSON blob in Supabase `app_settings` table
- `buildManagedQuizDataset()` merges both: built-ins first, managed appended
- Source badge: `MANAGED`

### Quiz ID generation
Slugified from title: `"AWS Security Deep Dive"` → `"aws-security-deep-dive"`.  
If collision exists, appends `-2`, `-3`, etc.

---

## E2E Test Checklist

### Step 1 — Create quiz
1. Go to `https://lms-amber-two.vercel.app/dashboard/admin/quiz-builder`
2. Click **+ New Quiz**
3. Fill: Title, Category, Difficulty, Duration, Premium=✓, Price=₹149
4. Click **Save Quiz** — note the auto-generated quiz ID in the list
5. Verify: quiz appears in Products page with MANAGED badge and Premium/₹149

### Step 2 — Add questions
1. Click the quiz in the list → Questions editor appears
2. Click **+ Add Question**, fill text + 4 options, select correct answer
3. Add at least 2 more questions
4. Click **Save Questions**
5. Verify: question count updates in the quiz list

### Step 3 — Purchase (test mode)
1. Log out → log in as a non-admin test user
2. Navigate to the new quiz (`/dashboard/quiz/<quiz-id>`)
3. Click purchase → Razorpay modal
4. Use test card: `4111 1111 1111 1111`, any future expiry, any CVV
5. Complete payment

### Step 4 — Verify in orders
1. Log in as admin → `/dashboard/admin/orders`
2. New order row appears with user name, quiz ID, ₹149, status=completed
3. Click the row → order detail page shows full payment info
4. Check Supabase dashboard → `orders` table has the record

### Step 5 — CRUD verification
| Operation | Action | Expected |
|-----------|--------|----------|
| CREATE | POST `/api/admin/quiz-builder` with valid body + admin token | 201, quiz in catalog |
| READ | GET `/api/admin/quiz-builder` | 200, merged list with _source |
| UPDATE | PATCH `/api/admin/quiz-builder/[id]` + `{title:"New"}` | 200, updated quiz |
| DELETE (managed) | DELETE `/api/admin/quiz-builder/[id]` | 200, quiz removed |
| DELETE (built-in) | DELETE `/api/admin/quiz-builder/clf-c02-full-exam` | 409 Conflict |
| Questions SAVE | PUT `/api/admin/quiz-builder/[id]/questions` | 200, count updated |
| Orders READ | GET `/api/admin/orders` | 200, paginated list |
| Order DETAIL | GET `/api/admin/orders/[orderId]` | 200, full order object |

---

## Migration — Apply Before Testing

Run `supabase/migrations/010_orders_and_purchases_fix.sql` in Supabase SQL Editor:  
Supabase Dashboard → your project → SQL Editor → paste → Run.

---

## Security

- All admin routes: Bearer JWT → `supabase.auth.getUser()` → `ADMIN_EMAILS` env check
- Service role key never in client code
- Rate limits: 30 req/min GET, 10 req/min mutations
- Payload limits: 8 KB quiz metadata, 256 KB questions bulk
- Zod schema validation on all inputs
- Built-in quiz deletion blocked (409) — prevents breaking the base catalog
- Orders: no client-side insert policy — only service_role can write
