# Testing Guide — Medicine Tracker

This document covers how to run all tests and how to manually test the web app locally. Mobile app testing will be added in Phase 2 when the Expo app is built (issue #28).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥20.x | https://nodejs.org |
| npm | ≥10.x | bundled with Node |

```bash
node --version   # should print v20.x or higher
npm --version
```

---

## Web App — Local Development

### 1. Install dependencies

```bash
cd medicine-tracker
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Opens at **http://localhost:5173** (or the next available port). Hot module replacement is active — changes to `.tsx`/`.ts`/`.css` files reload instantly.

> **Note:** The service worker is **not registered** in dev mode (`registerType: 'prompt'` and Vite's dev server doesn't serve from dist). To test PWA features (offline, notifications, install prompt) use the production build — see [PWA Testing](#5-pwa--offline-testing) below.

---

## Automated Test Suite

### Run all tests (single pass)

```bash
npm test
# or: npm run test
```

Expected output:
```
Test Files  10 passed (10)
     Tests  60 passed (60)
```

### Watch mode (re-runs on file save)

```bash
npm run test:watch
```

### Interactive browser UI

```bash
npm run test:ui
# Opens Vitest UI at http://localhost:51204
```

### What each file tests

| File | What it covers |
|------|---------------|
| `scheduling.test.ts` | `getDailySlots()` — slot generation per date; `getMissedDoses()` — past-pending detection |
| `MedicineRepository.test.ts` | Dexie CRUD: save, getAll, getById, update (put), soft-delete, inactive filter |
| `DoseLogRepository.test.ts` | getByDate, getByRange, upsert insert, upsert update (same id), deleteByMedicine |
| `SettingsRepository.test.ts` | Default row creation on first get, idempotent re-get, patientName update, reminderTime update, notificationsEnabled update |
| `export.test.ts` | `buildGridData()` — row per medicine, date cells, T/S/– symbols, taken overrides skipped |
| `notifications.test.ts` | `computeDelayMs()` — future/past/same-minute time computation |
| `types.test.ts` | Zod schema validation: valid Medicine, invalid name, missing schedules, valid DoseLog, DEFAULT_SETTINGS |
| `MedicineForm.test.tsx` | Form renders, name validation, slot validation, submit data shape, cancel, prefill on edit, close button |
| `MissedDoseBanner.test.tsx` | Empty state, count display, sheet open, Taken action callback, dismiss callback |
| `smoke.test.tsx` | All 4 pages (Today, Medicines, Settings, Export) render without crashing |

> Repository tests run against `fake-indexeddb` — no real browser or IndexedDB required. They are fast (~40 ms each) and run in Node via Vitest's jsdom environment.

---

## Manual Feature Testing

### 3. Add a medicine and mark a dose

1. Go to **Medicines** tab → tap **Add**
2. Fill in: name "Aspirin", amount "100", unit "mg", select **Morning** slot, pick a colour
3. Tap **Add medicine** → medicine appears in the list
4. Go to **Today** tab → **Morning** section shows "Aspirin"
5. Tap the **Pending** pill → turns green **Taken**
6. Tap again → reverts to **Pending**
7. Long-press the pill (hold ~500 ms) → `DoseActionModal` opens → tap **Skipped** → pill turns red

### 4. Test missed dose banner

1. Open browser DevTools → Application → IndexedDB → `MedicineTrackerDB` → `doseLogs`
2. Manually insert a record with `scheduledDate` = yesterday, `status = 'pending'`
3. Reload the app → yellow banner appears with the missed count
4. Tap **View missed** → sheet opens with inline Taken/Skip buttons
5. Tap × on the banner → banner dismissed for the session

---

## 5. PWA / Offline Testing

The service worker only activates in a **production build** served over HTTPS or localhost.

### Build and preview locally

```bash
npm run build
npm run preview
# Serves at http://localhost:4173
```

### Test offline mode

1. Open **http://localhost:4173** in Chrome
2. Open DevTools → Application → Service Workers → verify SW is registered and active
3. DevTools → Network → set throttling to **Offline**
4. Reload the page → app loads from cache ✓
5. Mark a dose → change persists to IndexedDB ✓
6. Switch back to **No throttling** → "You're back online" toast appears ✓

### Test PWA install

1. With the preview server running: open **http://localhost:4173** in Chrome
2. Click the install icon in the address bar (or three-dot menu → "Install Medicine Tracker")
3. Installed app opens in standalone window (no browser chrome) ✓
4. Check: app icon appears in OS app launcher ✓

### Lighthouse PWA audit

1. Run `npm run build && npm run preview`
2. Open Chrome DevTools → Lighthouse → check **Progressive Web App** → Generate report
3. Expected: all PWA checks pass (manifest valid, SW registered, offline capable)

---

## 6. Notification Testing

> Notifications require HTTPS or localhost. Use the preview build (`npm run build && npm run preview`).

### Grant permission and send a test notification

1. Open **http://localhost:4173** → go to **Settings** tab
2. Toggle **Dose reminders** on → browser permission prompt appears → click **Allow**
3. Tap **Send test notification** → notification appears in OS tray within 1–2 seconds ✓
4. Click the notification → app focuses/opens ✓

### Test scheduled notification

1. In Settings, set **Morning** reminder time to 2 minutes from now
2. Keep the app open (or bring it to foreground at least once after changing the time)
3. Wait → notification fires at the scheduled time ✓

> **Remember:** Phase 1 notifications require the app to have been opened at least once that day. True background push is Phase 2 (issue #26).

### If notifications don't appear

- Check: `Notification.permission` in browser console — must be `"granted"`
- Check: DevTools → Application → Service Workers → SW must be active
- Check: OS notification settings — browser notifications must be allowed system-wide
- macOS: System Settings → Notifications → find Chrome/Firefox → enable

---

## 7. Export Testing

1. Make sure you have dose logs for the last few days (mark some doses as taken/skipped)
2. Go to **Export** tab
3. Tap **Last 7** preset → date pickers auto-fill ✓
4. Tap **Download PDF** → browser downloads `medicine-log-YYYY-MM-DD-YYYY-MM-DD.pdf`
5. Open PDF → verify landscape A4, medicine grid with T/S/– cells ✓
6. Tap **Download Excel** → browser downloads `.xlsx`
7. Open in Excel/Sheets → verify two sheets: "Log" (raw data) and "Grid" (summary) ✓
8. Set a 30-day range (via "Last 30" preset) → Download PDF → column headers show day numbers ("1"–"30") ✓

---

## 8. Type Checking

```bash
npx tsc --noEmit
```

Should complete with zero errors.

---

## 9. Production Build Verification

```bash
npm run build
```

Expected output:
- Zero TypeScript errors
- `dist/` folder created
- `dist/sw.js` present (service worker)
- No Rollup warnings about dynamic imports (only chunk-size warnings are acceptable)

---

## 10. Mobile App Testing (Phase 2 — not yet built)

The Expo native app will be implemented in Phase 2 (issue #28). Once built, this section will cover:

```bash
# Prerequisites for Phase 2 mobile testing
npm install -g eas-cli
npx expo install

# Run on iOS simulator (requires macOS + Xcode)
npx expo start --ios

# Run on Android emulator (requires Android Studio)
npx expo start --android

# Run on physical device
npx expo start
# Scan QR code with Expo Go app
```

**What will be tested:**
- All 4 tabs (Today, Medicines, Settings, Export) function identically to web app
- Haptic feedback on dose marked (requires physical device)
- expo-sqlite persistence survives app close/reopen
- Sign in with same Supabase account → same data as web app
- Push notifications delivered when app is fully closed (APNs/FCM)

---

## 11. CI / Pre-push Checklist

Before pushing to a feature branch and opening a PR:

```bash
npm test              # 60/60 tests pass
npx tsc --noEmit      # zero TypeScript errors
npm run build         # clean production build
```

All three must pass before merging to `main`.
