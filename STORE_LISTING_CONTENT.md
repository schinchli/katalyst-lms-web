# Store Listing Content — Katalyst LMS
> **Date:** 2026-03-18 | Copy ready for Play Console + App Store Connect

---

## App Identity

| Field | Value |
|-------|-------|
| **App name** (iOS) | Katalyst — AWS & AI Prep |
| **App name** (Android) | Katalyst: AWS & AI Prep |
| **Package / Bundle ID** | `com.katalysthq.app` |
| **Category** (iOS) | Education |
| **Category** (Android) | Education |
| **Content rating** | Everyone / 4+ |
| **Language** | English (US) |

---

## Short Description (80 chars — Android only)

```
Master AWS & AI certifications with adaptive quizzes and a live leaderboard.
```

## Subtitle (30 chars — iOS only)

```
Cloud certification quizzes
```

---

## Full Description (Play Store — up to 4000 chars)

```
Katalyst is the fastest way to crack AWS and AI certifications.

Whether you're aiming for the AWS Cloud Practitioner (CLF-C02), AI Practitioner, or exploring Generative AI fundamentals, Katalyst delivers focused, exam-aligned practice that fits your schedule.

🎯 WHAT'S INSIDE
• 400+ exam-quality questions across AWS and GenAI domains
• Full CLF-C02 practice exam (195 questions, timed)
• Domain-specific quizzes: Cloud Concepts, Security, Technology, Billing & Pricing
• 14 GenAI topic categories: Prompt Engineering, LLMs, RAG, Agents, and more
• Detailed explanations for every answer — understand the "why", not just the "what"

📊 TRACK YOUR PROGRESS
• Daily streak counter — build the habit
• XP and coin rewards for every quiz completed
• Personal progress dashboard with scores, attempts, and accuracy
• Global leaderboard — compete with learners worldwide (daily, monthly, all-time)

🧠 SMART LEARNING
• Adaptive question ordering based on your weak areas
• Review mode — revisit questions you got wrong
• Timed exam simulation for real test conditions
• Instant feedback with full explanations

✨ DESIGNED FOR BUSY PROFESSIONALS
• Clean, distraction-free interface
• Study anywhere — fully offline-capable quiz sessions
• 5-minute micro-sessions or 90-minute full exams — your pace
• Dark mode supported

🔒 PRIVACY FIRST
• Secure login via email or social sign-in
• Your data is yours — no selling to third parties
• Privacy policy: https://katalysthq.app/privacy

Start free. Upgrade for unlimited access to all premium quizzes and the full CLF-C02 exam.

Supercharge Your Career. Learn Skills Faster.
```

---

## App Store Description (iOS — up to 4000 chars)

Same as Play Store description above. Apple accepts identical copy.

---

## Keywords (iOS — 100 chars max, comma-separated)

```
aws,cloud,certification,quiz,CLF-C02,AI,exam prep,flashcards,leaderboard,machine learning
```

---

## What's New (first release)

```
🎉 Welcome to Katalyst!

• 400+ exam-quality questions for AWS CLF-C02 and GenAI certifications
• Timed full practice exam (195 questions)
• Live global leaderboard with daily and monthly rankings
• Daily streaks, XP, and coins to keep you motivated
• Dark mode and clean, distraction-free design
```

---

## Screenshots Plan

See `SCREENSHOT_CAPTURE_PLAN.md` for the full capture script.

### Required screen subjects (in order):
1. **Home / Dashboard** — streak, XP, quick-start quiz cards
2. **Quiz in progress** — question with answer options (one highlighted)
3. **Quiz results** — score breakdown with coins/XP earned
4. **Leaderboard** — top 5 users with rankings and XP
5. **Learning hub** — course list with progress indicators
6. **Profile / Growth** — streak calendar, achievement badges

---

## App Icon

- **File**: `mobile/assets/icon.png` (1024×1024)
- **Adaptive icon fg**: `mobile/assets/adaptive-icon.png`
- **Adaptive icon bg color**: `#7367F0` (Katalyst purple)
- **Play Store icon** (512×512): export from `icon.png`

---

## Feature Graphic (Android — 1024×500px)

Recommended design:
- Background: deep purple gradient `#7367F0 → #4A3DB7`
- Katalyst wordmark centred
- Tagline: "Supercharge Your Career. Learn Skills Faster."
- Mock phone showing dashboard on right side
- Create in Figma / Canva

---

## Support & Legal URLs

| URL | Status |
|-----|--------|
| Privacy policy | `https://lms-amber-two.vercel.app/privacy` (page needs creating) |
| Terms of service | `https://lms-amber-two.vercel.app/terms` (page needs creating) |
| Support email | `support@katalysthq.app` (set up forwarding) |
| Marketing site | `https://lms-amber-two.vercel.app` |

> **Action required:** Create `/privacy` and `/terms` pages in `apps/web/src/app/` before submitting to either store.
