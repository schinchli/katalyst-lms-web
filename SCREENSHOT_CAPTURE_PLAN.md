# Screenshot Capture Plan — Katalyst LMS
> **Date:** 2026-03-18 | Required for both Play Store and App Store submissions

---

## Required Screenshot Sizes

| Store | Device | Resolution | Count |
|-------|--------|-----------|-------|
| App Store | iPhone 6.9" (iPhone 16 Pro Max) | 1320×2868px | 6–10 |
| App Store | iPad 12.9" (optional) | 2048×2732px | 6–10 |
| Play Store | Phone portrait | Min 320×568px | 2–8 |

---

## iOS Simulator Screenshot Commands

```bash
# Boot iPhone 16 Pro Max simulator
xcrun simctl boot "iPhone 16 Pro Max"
open /Applications/Simulator.app

# Start Metro
cd /Users/schinchli/Documents/Projects/lms/mobile
npx expo start --port 8083

# Open app in simulator
xcrun simctl openurl booted "exp://localhost:8083"

# Take screenshot (saves to ~/Desktop)
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-01-home.png
```

---

## Android Emulator Screenshot Commands

```bash
# Capture screenshot via ADB
adb exec-out screencap -p > ~/Desktop/katalyst-android-01-home.png

# Or use Android Studio Device Manager → More → Screenshot
```

---

## Shot List & Navigation Steps

### Shot 1 — Home / Dashboard
**Goal:** Show streak, XP bar, quiz cards with progress rings

```bash
# Navigate to Home tab (tab 1, bottom-left)
xcrun simctl io booted tap 50 820       # Home tab
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-01-home.png
```

**Annotation overlay ideas:** "Daily Streak 🔥", "XP Progress", "Start Today's Quiz"

---

### Shot 2 — Quiz in Progress (single question)
**Goal:** Show a question with 4 answer options, timer running

```bash
# From Home tab, tap the first quiz card (approx coords on 393×852 screen)
xcrun simctl io booted tap 196 380      # Tap first quiz card
sleep 1.5
xcrun simctl io booted tap 196 380      # Tap "Start Quiz" button
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-02-quiz-question.png
```

---

### Shot 3 — Answer Selected (correct)
**Goal:** Show green highlight on correct answer + explanation

```bash
# Tap option A (first answer)
xcrun simctl io booted tap 196 420
sleep 0.5
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-03-quiz-answer.png
```

---

### Shot 4 — Quiz Results
**Goal:** Show score card with XP earned, coins, pass/fail badge

```bash
# Complete quiz then screenshot results screen
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-04-quiz-results.png
```

---

### Shot 5 — Leaderboard
**Goal:** Show top users with rank badges, XP scores, user avatar initials

```bash
# Navigate to Growth tab (tab 4)
xcrun simctl io booted tap 315 820      # Growth tab
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-05-leaderboard.png
```

---

### Shot 6 — Learning Hub / Resources
**Goal:** Show course list with progress indicators and YouTube thumbnails

```bash
# Navigate to Learn tab (tab 3)
xcrun simctl io booted tap 196 820      # Learn tab
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-06-learn.png
```

---

### Shot 7 — Profile / Achievements
**Goal:** Show user profile, streak calendar, XP total, achievement badges

```bash
# Navigate to Profile tab (tab 5)
xcrun simctl io booted tap 373 820      # Profile tab
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-07-profile.png
```

---

### Shot 8 — Quizzes List
**Goal:** Show all available quizzes with difficulty badges and premium locks

```bash
# Navigate to Quizzes tab (tab 2)
xcrun simctl io booted tap 118 820      # Quizzes tab
sleep 1
xcrun simctl io booted screenshot ~/Desktop/katalyst-ss-08-quizzes.png
```

---

## Post-Processing

1. **Add device frame** (optional): Use [Rottenwood](https://rottenwood.com) or Figma iPhone frame mockups
2. **Add text overlays**: Short benefit-focused captions, 2–3 words max
3. **Consistent background**: Use brand purple `#7367F0` behind device frames
4. **Export**: PNG at full resolution (no compression)

---

## Automation Script

```bash
#!/bin/bash
# run-screenshots.sh — captures all 8 shots sequentially

SIM="iPhone 16 Pro"
OUT="$HOME/Desktop/katalyst-screenshots"
mkdir -p "$OUT"

DEVICE=$(xcrun simctl list devices | grep "$SIM" | grep "Booted" | awk -F'[()]' '{print $2}')
if [ -z "$DEVICE" ]; then
  echo "Boot $SIM simulator first"
  exit 1
fi

take() {
  local name="$1"; local delay="${2:-1}"
  sleep "$delay"
  xcrun simctl io "$DEVICE" screenshot "$OUT/${name}.png"
  echo "✅ $name"
}

# Home
xcrun simctl io "$DEVICE" tap 50 820; take "01-home" 1.5

# Quizzes
xcrun simctl io "$DEVICE" tap 118 820; take "08-quizzes" 1.5

# Learn
xcrun simctl io "$DEVICE" tap 196 820; take "06-learn" 1.5

# Growth (Leaderboard)
xcrun simctl io "$DEVICE" tap 315 820; take "05-leaderboard" 1.5

# Profile
xcrun simctl io "$DEVICE" tap 373 820; take "07-profile" 1.5

echo "Screenshots saved to $OUT"
```

```bash
chmod +x run-screenshots.sh && ./run-screenshots.sh
```

---

## Checklist

- [ ] Metro running on port 8083
- [ ] iPhone 16 Pro simulator booted
- [ ] App loaded with a test user (not guest — shows real data)
- [ ] Leaderboard has at least 3 entries visible
- [ ] Profile shows streak > 0
- [ ] Quizzes list shows mix of free and premium cards
- [ ] All 8 screenshots captured at 1x (simulator outputs at display scale)
- [ ] Post-process: add device frame + text overlays
- [ ] Upload to App Store Connect and Play Console
