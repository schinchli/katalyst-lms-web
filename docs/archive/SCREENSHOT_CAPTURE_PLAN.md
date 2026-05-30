# Screenshot Capture Plan — Katalyst LMS
> **Updated:** 2026-03-18

---

## Required Sizes at a Glance

| Store | Device | Recommended size | Min | Max | Min count |
|-------|--------|-----------------|-----|-----|-----------|
| Play Store | Phone | **1080 × 1920 px** | 320px short side | 3840px either | **2** |
| Play Store | Feature graphic | **1024 × 500 px** | — | — | 1 (required if video) |
| App Store | iPhone 6.9" | **1320 × 2868 px** | — | — | **1** |
| App Store | iPad 12.9" | 2048 × 2732 px | — | — | Optional |

> iOS simulator (iPhone 16 Pro) outputs **1179 × 2556 px** — valid for both stores. Use as-is or export at 1080×2340 for Android.

---

## Step 1 — Boot simulator and start Metro

```bash
# Terminal 1 — start Metro
cd ~/Documents/Projects/lms/mobile
npx expo start --port 8083

# Terminal 2 — open simulator
xcrun simctl boot "iPhone 16 Pro"
open /Applications/Simulator.app

# Wait for Metro to be ready, then open app
xcrun simctl openurl booted "exp://localhost:8083"
```

---

## Step 2 — Prepare the app for screenshots

Before capturing, make the app look its best:
- Sign in with a real test account (not guest) so all data shows
- Make sure the leaderboard has entries (your test account + at least 2 others)
- Set streak to a visible number (complete a quiz to trigger streak)
- Enable dark mode (Settings → Appearance) — looks better in screenshots

---

## Step 3 — Capture all 8 shots

Run this script (or capture manually using the commands below):

```bash
#!/usr/bin/env bash
# capture-screenshots.sh
# Run from: ~/Documents/Projects/lms/mobile

OUT="$HOME/Desktop/katalyst-screenshots"
mkdir -p "$OUT"

DEVICE=$(xcrun simctl list devices booted | grep -m1 "iPhone" | awk -F'[()]' '{print $2}')
echo "Device: $DEVICE"

tap()  { xcrun simctl io "$DEVICE" tap  "$1" "$2"; }
shot() { sleep "${3:-1.5}"; xcrun simctl io "$DEVICE" screenshot "$OUT/${1}.png"; echo "✅ $1"; }

# Tab bar Y position on iPhone 16 Pro (852pt screen height, tab bar ~y=820)
TAB_Y=820

# ── Shot 1: Home ──────────────────────────────────────────────
tap 50 $TAB_Y           # Home tab (leftmost)
shot "01-home" 2

# ── Shot 2: Quiz in progress ──────────────────────────────────
tap 196 370             # Tap first quiz card
sleep 1.5
tap 196 700             # Tap "Start Quiz" button
sleep 1.5
shot "02-quiz-question" 1

# ── Shot 3: Answer selected ───────────────────────────────────
tap 196 430             # Tap first answer option
shot "03-quiz-answer" 1

# ── Shot 4: Quiz results ──────────────────────────────────────
# Navigate through remaining questions quickly, then capture results
shot "04-quiz-results" 2

# ── Shot 5: Leaderboard ───────────────────────────────────────
tap 315 $TAB_Y          # Growth tab
sleep 1.5
shot "05-leaderboard" 1.5

# ── Shot 6: Quizzes list ──────────────────────────────────────
tap 118 $TAB_Y          # Quizzes tab
sleep 1.5
shot "06-quizzes-list" 1.5

# ── Shot 7: Profile ───────────────────────────────────────────
tap 373 $TAB_Y          # Profile tab (rightmost)
sleep 1.5
shot "07-profile" 1.5

# ── Shot 8: Learn tab ─────────────────────────────────────────
tap 196 $TAB_Y          # Learn tab (middle)
sleep 1.5
shot "08-learn" 1.5

echo ""
echo "All screenshots saved to: $OUT"
echo "Sizes will be 1179×2556 px (iPhone 16 Pro @3x)"
```

```bash
chmod +x capture-screenshots.sh && bash capture-screenshots.sh
```

---

## Step 4 — Add text overlays in Canva

### Canva setup
1. Go to canva.com → New design → Custom size → **1080 × 1920 px**
2. Upload each screenshot as the background
3. Add text overlay for each shot using the spec below

### Overlay spec per screenshot

| Shot | Overlay text | Position |
|------|-------------|---------|
| 01-home | **"400+ AWS & AI questions. Ready when you are."** | Top 15% |
| 02-quiz-question | **"Exam-quality questions. Timed. Explained."** | Bottom 15% |
| 03-quiz-answer | **"Learn the *why* behind every answer"** | Bottom 15% |
| 04-quiz-results | **"Track every score. See your improvement."** | Top 15% |
| 05-leaderboard | **"Compete globally. Daily. Monthly. All-time."** | Top 15% |
| 06-quizzes-list | **"Full CLF-C02 exam — 195 questions, timed."** | Bottom 15% |
| 07-profile | **"Build the habit. Never break the streak."** | Top 15% |
| 08-learn | **"Watch. Practice. Pass."** | Bottom 15% |

### Text overlay style
```
Font:       Bold sans-serif (Canva: "Montserrat Bold" or "Poppins Bold")
Size:       64–72 px (at 1080px canvas)
Colour:     White #FFFFFF
Background: Rounded rectangle, #000000 at 55% opacity, 20px radius
Padding:    24px horizontal, 14px vertical around text
```

### Accent keyword highlight
Wrap one keyword per overlay in a **Katalyst purple** (#7367F0) span/box — e.g. "CLF-C02" or "leaderboard".

---

## Step 5 — Export

```
Format: PNG (best quality) or JPEG at 95%+
Canvas size: 1080×1920 — DO NOT resize after adding overlays
Colour space: sRGB
No transparency (Play Store rejects alpha on phone screenshots)
```

---

## Feature Graphic — 1024 × 500 px

```bash
# In Canva: New design → 1024 × 500 px
```

Elements (left → right):
```
Left 60%:
  - "Katalyst" — white, Montserrat ExtraBold, 96px
  - "AWS & AI Certification Prep" — white, 36px, semi-bold
  - "400+ questions · Leaderboard · Daily streaks" — white/muted, 24px
  - Small purple pill badges: "CLF-C02"  "GenAI"  "Free to start"

Right 40%:
  - Phone mockup (use Canva's free device frames)
  - Drop in screenshot 01-home as the phone screen
  - Slight tilt (5° left), drop shadow

Background:
  - Linear gradient: #7367F0 → #4A3DB7 (left to right)
  - Optional: very subtle dot grid at 8% white opacity
```

Safe zone: **50px from every edge** — nothing important outside this boundary (some devices crop edges on cards).

---

## App Icon — 512 × 512 px

```bash
# Export from your existing 1024×1024 icon:
sips -z 512 512 mobile/assets/images/icon.png --out ~/Desktop/katalyst-icon-512.png
```

Play Store requirements: PNG, no alpha (use a solid background colour — the icon already has `#0F172A` background).

---

## Quick Checklist Before Uploading

- [ ] All screenshots are **1080×1920 px** or larger (aspect ratio 9:16)
- [ ] No alpha channel in phone screenshots (PNG export as "no transparency")
- [ ] Text overlays added to all 8 shots
- [ ] Feature graphic is **1024×500 px**, no alpha
- [ ] App icon is **512×512 px**
- [ ] At least **2 phone screenshots** ready (Play Store minimum)
- [ ] All in sRGB colour space

---

## Android-native screenshots (optional — same dimensions as iOS)

If you want purely Android screenshots (shows Android nav bar instead of iOS):

```bash
# Start Android emulator (Pixel 9 = 1080×2424 native)
# In Android Studio: Device Manager → Pixel 9 → Launch

# After app is loaded:
adb exec-out screencap -p > ~/Desktop/katalyst-android-01.png

# Or use Android Studio: ⋮ → Take screenshot (saves automatically)
```

Pixel 9 native resolution 1080×2424 is within Play Store limits and looks cleaner for Android listings.
