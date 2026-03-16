# Store Readiness Audit
Date: 2026-03-16
Status: PRE-SUBMISSION CHECKLIST

## Apple App Store
### Done
- Privacy policy URL: /privacy (managed content via admin)
- Terms of service URL: /terms (managed content via admin)
- Account deletion flow: /dashboard/profile → Danger Zone → Delete Account (inline confirmation, no window.confirm, real deletion via /api/account/delete)
- NSUserTrackingUsageDescription added to ios/lms/Info.plist
- PrivacyInfo.xcprivacy manifest created at ios/lms/PrivacyInfo.xcprivacy
- NSAppTransportSecurity: NSAllowsArbitraryLoads = false (already set)
- No web-based digital goods purchase path on mobile (Razorpay removed from mobile flows)

### Hard Blockers — MUST FIX BEFORE SUBMISSION
- **IAP not implemented**: Premium subscriptions and coin purchases MUST use Apple StoreKit (expo-iap or react-native-purchases). Currently the mobile app does not expose any purchase flow — but any future payment feature must route through Apple IAP for digital goods. This WILL cause App Review rejection (guideline 3.1.1) if added without StoreKit.
- **ATT SDK missing**: expo-tracking-transparency is not installed. TODO comment added in mobile/app/_layout.tsx. Required before any analytics or advertising SDK is initialised (guideline 5.1.4). Install: `npx expo install expo-tracking-transparency` and uncomment the block in _layout.tsx.
- **Restore Purchases flow absent**: Required by App Review guideline 3.1.1 for any app with in-app purchases. Not blocking until IAP is added.

### Needs Verification
- App Review guideline 4.2 (Minimum Functionality): verify all quiz, learning, and leaderboard features work end-to-end on a physical device before submission
- Guideline 5.1.1 (Privacy Data Collection): cross-check every Supabase table written (user_profiles, quiz_results, coin_transactions, referral_redemptions) against the Privacy Nutrition Label in App Store Connect — all must be declared
- Guideline 4.8 Sign in with Apple: if any other third-party login (Google) is added later, Sign in with Apple must also be offered
- EAS build profile must set `ios.image: "macos-15-xcode-26"` before April 28, 2026 (see mobile/CLAUDE.md §12.4a)

## Google Play Store
### Done
- Privacy policy URL accessible via /privacy
- Account deletion in-app path present (required since Dec 2023) — mobile/app/(tabs)/profile.tsx Danger Zone section
- Permissions: INTERNET + ACCESS_NETWORK_STATE only (added to mobile/app.json)

### Hard Blockers — MUST FIX BEFORE SUBMISSION
- **Billing API**: Google Play Billing is required for digital goods. expo-iap or react-native-purchases must be integrated before any in-app purchase is exposed on Android.
- **Data Safety form**: Must declare email address and quiz result data collection in Play Console → App Content → Data Safety. This is a manual step in the console — not code.

### Needs Verification
- Target SDK level: Expo SDK 54 targets API 34 by default; verify API 35 (Android 15) compliance before submission for new 2025 apps
- 64-bit compliance: Expo SDK 54 + RN 0.81 are compliant out of the box
- 16KB page size compliance: Expo SDK 54 + RN 0.81 are compliant. Verify any future native dependencies.

## Both Stores
### Required Before Submission
1. [ ] Implement Apple StoreKit / Google Play Billing (react-native-purchases is the recommended unified library)
2. [ ] Install expo-tracking-transparency and uncomment ATT block in mobile/app/_layout.tsx
3. [ ] Complete Data Safety section in Play Console
4. [ ] Complete Privacy Nutrition Label in App Store Connect
5. [ ] Add Restore Purchases flow (required once IAP is live)
6. [ ] Final smoke test on physical devices: iOS device + Android device
7. [ ] App screenshots and metadata prepared in App Store Connect and Play Console
8. [ ] Provide test credentials in App Review notes (admin account for full feature access)
9. [ ] Tag the production release: `git tag v1.0.0` in mobile/
10. [ ] EAS production profile: set `ios.image: "macos-15-xcode-26"` before April 28, 2026

## Implementation Notes

### Account Deletion
- Web: /dashboard/profile → Danger Zone → inline confirmation modal (type "DELETE") → POST /api/account/delete
- Mobile: profile tab → Danger Zone → inline TextInput confirmation → same API
- API: deletes quiz_results → coin_transactions (best-effort) → referral_redemptions (best-effort) → user_profiles → auth.users
- Rate limit: 5 req/min (most restrictive in the system)
- On success (web): signs out + redirects to /login?deleted=1 with dismissible banner
- On success (mobile): calls signOut() → navigates to login via AuthGuard

### Maintenance Mode + Force Update
- Admin configures via Settings page → System Features section
- Web: PlatformExperienceProvider fetches /api/system-features on every page load; renders MaintenanceBanner full-screen if maintenanceMode === true
- Mobile: systemFeatureStore hydrated at startup; ThemedApp checks maintenanceMode before rendering navigation
- Force update: compares Constants.expoConfig?.version against minimumAppVersion using semver; shows ForceUpdateScreen (non-dismissible) if current < minimum

### ATT (iOS App Tracking Transparency)
- NSUserTrackingUsageDescription added to ios/lms/Info.plist
- expo-tracking-transparency NOT yet installed — TODO comment in mobile/app/_layout.tsx marks exact insertion point
- Install command: `npx expo install expo-tracking-transparency`
- After install: uncomment the ATT block in RootLayout's initAuth().then() callback
