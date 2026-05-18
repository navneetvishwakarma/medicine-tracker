# Changelog

All notable changes to Medicine Tracker are documented here.

---

## [v1.0.0] — 2026-05-18 · Phase 1 Complete

### Summary

First production release. A fully offline-capable Progressive Web App for personal medication tracking — installable on iOS, Android, and desktop, works entirely without a network connection.

---

### Features

#### Medicine Management
- Add, edit, and archive medicines
- 8 colour labels (red, orange, yellow, green, teal, blue, purple, pink)
- Meal-relation selector: Before / After / With / None
- **Structured dosage input** — numeric amount field + unit dropdown (mg, mcg, g, ml, drops, IU, puff, tablet, capsule, %)
- Custom time-slot schedules (Morning / Noon / Evening / Night) with per-slot time picker
- Notes field for extra instructions

#### Today's Dose Tracker
- Slot-grouped layout: doses grouped by Morning / Noon / Evening / Night
- **Now badge** highlights the currently active time slot
- **✓ All done** indicator when every dose in a slot is marked
- Tap status pill to toggle Pending ↔ Taken
- Long-press for the full action modal (Taken, Skipped + optional note)
- Date navigator — browse any past or future date
- Loading skeleton while data hydrates

#### Missed Dose Banner
- Scans the last 7 days for unresolved pending doses
- Shows medicine name preview in the banner
- Inline Taken / Skip actions in the bottom sheet
- Dismissible per session

#### Settings
- Patient name
- Per-slot reminder times (editable time pickers for Morning / Noon / Evening / Night)
- Notification toggle with OS permission request flow
- **Test notification button** — fires via ServiceWorkerRegistration (works in modern Chrome)

#### Local Push Notifications
- Schedules reminder timeouts on app open and foreground restore (`visibilitychange`)
- Fires via `ServiceWorkerRegistration.showNotification()` — no deprecation warnings
- Service worker handles `notificationclick` → opens app
- Phase 2 upgrade path: add VAPID subscription, switch to server-push with zero SW changes

#### Export
- Date range up to **31 days**
- **Quick-select presets**: Last 7 days, Last 30 days, This month, Last month
- Active preset highlighted; manual date pickers stay in sync
- **PDF** (A4 landscape): T / S / – grid; headers switch to day-number-only for ranges > 14 days
- **Excel**: raw dose log sheet + formatted summary grid sheet

#### Offline PWA
- Full asset precache via `vite-plugin-pwa` (injectManifest mode)
- App loads and works with zero network
- Online / offline toast notifications
- Installable on iOS (Add to Home Screen), Android, and desktop Chrome/Edge

---

### Architecture

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (Warm Precision design system) |
| Storage | Dexie.js v4 (IndexedDB) |
| Domain state | TanStack Query v5 |
| UI state | Zustand |
| PWA | vite-plugin-pwa (injectManifest) |
| Routing | React Router v7 |
| Export | jsPDF + SheetJS |
| Validation | Zod |

**Repository pattern** — `IMedicineRepository` / `IDoseLogRepository` interfaces decouple storage from components. Phase 2 migration = swap Dexie implementation for Supabase, zero component changes.

**Pure domain functions** in `src/domain/` (scheduling, export grid) have zero framework dependencies and are fully unit-testable without a browser.

---

### Design System — Warm Precision

- Warm gray palette overriding Tailwind's default cool grays via `@theme`
- 3 px left colour accent bars on medicine cards
- `rounded-2xl` cards, `rounded-t-3xl` bottom sheets, `backdrop-filter: blur(2px)` overlays
- System font stack, antialiasing, tap-highlight removed
- Consistent section header style: 11 px bold uppercase tracking-widest

---

### Quality

- **60 tests** across 10 test files (Vitest + Testing Library + fake-indexeddb)
- Zero TypeScript errors; clean production build
- 17 code-review findings resolved (security, correctness, style — H1 through L11)
- Netlify deployment config with correct cache headers (`no-cache` for SW/HTML, `immutable` for hashed assets)

---

### Bug Fixes

- `fix`: Test notification button now routes through `ServiceWorkerRegistration.showNotification()` instead of the deprecated `new Notification()` constructor — closes #15
- `fix`: IndexedDB boolean filter uses Dexie cursor `.filter()` instead of `.equals(1)` — avoids silent empty results in fake-indexeddb test environment
- `fix`: Resolved all 17 code-review findings including missing error boundaries, memory leak in notification timeouts, and missing `aria-label` attributes

---

### Phase 2 Preview

Phase 2 will:
- Extract `packages/core` — types, repository interfaces, domain functions, TanStack Query hooks
- Add a Supabase storage adapter (implements the same repository interfaces)
- Build an Expo native mobile app that imports from `@medicine-tracker/core`
- Enable true background push notifications via VAPID + Supabase Edge Functions
- Add multi-device sync and caregiver access

---

[v1.0.0]: https://github.com/navneetvishwakarma/medicine-tracker/releases/tag/v1.0.0
