# Play Console Copy/Paste Guide — Katalyst LMS

Use this during Google Play Console setup for the first Android submission.

Last reviewed: 2026-03-23

## Store Listing

### App name
`Katalyst: AWS & Cloud Certification Quiz`

### Short description
`AWS CLF-C02 & AI cert prep: 400+ exam questions, daily streaks & leaderboard.`

### Full description
Use the Play Store full description from:
[STORE_LISTING_CONTENT.md](/Users/schinchli/Documents/Projects/lms/STORE_LISTING_CONTENT.md)

### App category
`Education`

### Tags
Use education / quiz / exam prep style tags that best match the available Play Console options.

## App Content

### Privacy policy URL
`https://lms-amber-two.vercel.app/privacy`

### Account deletion URL
`https://lms-amber-two.vercel.app/delete-account`

### Account deletion discoverability note
You can keep this for internal reviewer notes:

`Users can delete their account in-app from Profile -> Danger Zone -> Delete Account, or follow the public instructions page at https://lms-amber-two.vercel.app/delete-account.`

### Ads declaration
Choose this based on the exact production build you upload:

- If the uploaded Android build shows ads: `Yes`
- If the uploaded Android build does not show ads: `No`

Important:
- The current repo no longer requests Android Advertising ID.
- Do not answer `Yes` unless the production build actually contains ads.

### Target audience
Recommended:
- `18 and over`

Safer reason:
- The app is exam prep for AWS / AI certifications and is not designed for children.

If you intentionally want `13+`, review your copy, guest mode, support flow, and policy position first.

## Data Safety

### Data collected

Mark these as collected:

- Email address
- Name
- User-generated content
- App interactions
- Financial info or purchase history, if premium access/purchases are active in production

Mark these as not collected:

- Location
- Contacts
- Photos and videos
- Audio files
- Files and docs
- Messages
- Calendar
- Health and fitness
- Web browsing
- Device or other IDs for advertising

### Data sharing

Recommended current answers from repo state:

- Email address: `No`
- Name: `No`
- User-generated content: `No`
- App interactions: `No`
- Financial info / purchase history: `No`

### Purpose mapping

Use these purposes where Play asks why data is collected:

- Email address: `App functionality`, `Account management`
- Name: `App functionality`, `Personalization`
- User-generated content: `App functionality`
- App interactions: `Analytics`, `App functionality`
- Financial info / purchase history: `App functionality`

### Security section

Use:

- Data is encrypted in transit: `Yes`
- Users can request that data is deleted: `Yes`

### Important exclusions

Use these only if they remain true in the exact build you submit:

- Advertising ID collected: `No`
- Location collected: `No`
- Data sold: `No`

## Content Rating

Recommended classification path for the current app:

- App type: `Education` or `Quiz / Educational`
- Violence: `No`
- Sexual content or nudity: `No`
- Gambling: `No`
- Illegal drugs: `No`
- Horror or disturbing content: `No`
- User-to-user interaction: `Limited` or `No`, depending on whether Play counts leaderboard/profile visibility as interaction in the questionnaire wording shown to you
- Personal info sharing between users: `No`

Expected outcome:
- Likely `Everyone` or another low-risk education rating

Important:
- Answer the questionnaire exactly as presented in Play Console.
- If a question is specifically about user interaction, leaderboard visibility, profile names, referrals, or public rankings, read the wording carefully before choosing `No`.

## Assets

### URLs
- Privacy policy: `https://lms-amber-two.vercel.app/privacy`
- Terms: `https://lms-amber-two.vercel.app/terms`
- Account deletion: `https://lms-amber-two.vercel.app/delete-account`
- Website: `https://lms-amber-two.vercel.app`
- Support email: `support@katalysthq.app`

### Required media
- App icon: 512x512
- Feature graphic: 1024x500
- Phone screenshots: minimum 2

Use:
[SCREENSHOT_CAPTURE_PLAN.md](/Users/schinchli/Documents/Projects/lms/SCREENSHOT_CAPTURE_PLAN.md)

## Final Pre-Submission Checks

Before clicking submit:

1. Confirm the uploaded Android build matches your Ads and Data Safety answers.
2. Confirm `support@katalysthq.app` is working.
3. Confirm these URLs are live:
   - `https://lms-amber-two.vercel.app/privacy`
   - `https://lms-amber-two.vercel.app/delete-account`
4. Confirm the production build has no unexpected permission prompts.
5. Confirm account deletion works from the in-app Profile screen.

## Source of Truth

If anything conflicts, use these files in this order:

1. [PLAYSTORE_LAUNCH_READINESS.md](/Users/schinchli/Documents/Projects/lms/PLAYSTORE_LAUNCH_READINESS.md)
2. [STORE_LISTING_CONTENT.md](/Users/schinchli/Documents/Projects/lms/STORE_LISTING_CONTENT.md)
3. [SCREENSHOT_CAPTURE_PLAN.md](/Users/schinchli/Documents/Projects/lms/SCREENSHOT_CAPTURE_PLAN.md)
