# Medicine Tracker — Architecture Document

**Version:** 1.1
**Date:** 2026-05-18
**Status:** Approved — reflects v1.0.0 shipped implementation

---

## 1. System Overview

Medicine Tracker is an offline-first Progressive Web App (PWA) that helps patients manage and track their own daily medication adherence. It replaces a paper-based grid tracker with a digital equivalent that works without internet, sends local reminders, and exports data to PDF/Excel.

Phase 1 primary user: **patient**. Caretaker multi-user support (`markedBy` attribution, active-user toggle, caretaker sync) is Phase 3.

Phase 1 is web-only. Phase 2 adds a native mobile app via Expo, sharing business logic through a `packages/core` monorepo package.

---

## 2. Architecture Principles

| Principle | Application |
|-----------|-------------|
| Offline-first | IndexedDB is the source of truth in Phase 1; Supabase is the sync layer in Phase 2 |
| Abstraction over implementation | Repository pattern decouples storage from business logic |
| Delay complexity | No backend, no auth, no sync in Phase 1 — validate product first |
| Platform-agnostic domain | Pure functions in `src/domain/` have zero framework dependencies |
| Swap, don't rewrite | Phase 2 swaps repository implementations; no component code changes |

---

## 3. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | React + TypeScript | 19 / 5.6 | Concurrent rendering, clean Phase 2 extraction |
| Build | Vite | 6 | Sub-second HMR, native ESM, best-in-class PWA plugin |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | 4 | CSS-first config, `@theme` token overrides, zero runtime CSS |
| Design system | Warm Precision | — | Warm gray palette via `@theme`, 3 px colour bars, rounded-2xl cards |
| Storage | Dexie.js (IndexedDB) | 4 | 35 KB, typed, devtools support, no COOP/COEP headers required |
| Domain state | TanStack Query | 5 | `queryFn = Dexie` → `queryFn = Supabase` in Phase 2, zero component changes |
| UI state | Zustand | 5 | Active date, toast queue, missed-banner dismissed — never domain state |
| Forms | React Hook Form + Zod | 7 / 3 | Type-safe validation; Zod schemas shared with Phase 2 `packages/core` |
| PWA | vite-plugin-pwa (injectManifest) | 0.21 | Custom service worker, full precaching, push event handling |
| Routing | React Router | 7 | File-based routes |
| Validation | Zod | 3 | Shared with Phase 2 `packages/core` |
| Dates | date-fns | 4 | Tree-shakeable, no Moment.js overhead |
| Export | jsPDF + SheetJS | 2.5 / 0.18 | Client-side PDF + Excel, no server dependency |
| Icons | Lucide React | 0.468 | Lightweight, consistent |
| Testing | Vitest + Testing Library + fake-indexeddb | 2 / 16 / 6 | Fast, no browser needed for repo tests |

**Why not wa-sqlite?** Bundle is ~800 KB gzipped vs Dexie's 35 KB. Requires COOP/COEP headers that break auth iframes. React Native Phase 2 uses `expo-sqlite` (native C binding) — web WASM gives zero carryover. IndexedDB is what Figma, Notion, and Slack use.

**Why not Expo from day 1?** Expo web is second-class in their own docs, adds 2–3 weeks of config (Metro, EAS, Gradle/Xcode), and if Phase 2 never ships the cost is pure waste. The Repository pattern, not the UI framework, enables mobile alignment.

---

## 4. Repository Pattern (Core Architecture)

Every component reads and writes through repository interfaces. No component imports Dexie directly. This is what makes Phase 2 a swap, not a rewrite.

```
src/repositories/
├── types.ts                        ← IMedicineRepository, IDoseLogRepository, ISettingsRepository
└── dexie/
    ├── db.ts                       ← Dexie instance + schema (versions 1 + 2)
    ├── MedicineRepository.ts       ← implements IMedicineRepository
    ├── DoseLogRepository.ts        ← implements IDoseLogRepository
    └── SettingsRepository.ts       ← implements ISettingsRepository (singleton row, id: 1)
```

**Phase 1 DI — `src/context/RepositoryContext.tsx`:**
```typescript
interface IMedicineRepository {
  getAll(): Promise<Medicine[]>
  getById(id: string): Promise<Medicine | undefined>
  save(medicine: Medicine): Promise<void>
  delete(id: string): Promise<void>
}
// Context provides: DexieMedicineRepository, DexieDoseLogRepository, DexieSettingsRepository
```

**Phase 2 — drop-in swap (zero component changes):**
```typescript
class SupabaseMedicineRepository implements IMedicineRepository { ... }
// Register in RepositoryContext when session exists
```

> **Important implementation note:** `DexieMedicineRepository.getAll()` uses Dexie cursor-level `.filter((m) => m.active)` rather than `.where('active').equals(1)`. The `.equals(1)` approach silently returns `[]` in the `fake-indexeddb` test environment because it doesn't coerce TypeScript `boolean` to IndexedDB integer `1`. The `.filter()` approach works correctly in all environments.

---

## 5. Data Model

All types are defined in `src/types/index.ts` as Zod schemas and inferred TypeScript types.

```typescript
// ── Enums ──────────────────────────────────────────────────────────────────
type TimeSlot     = 'morning' | 'noon' | 'evening' | 'night'
type MealRelation = 'before' | 'after' | 'with' | 'none'
type DoseStatus   = 'pending' | 'taken' | 'skipped'          // no 'missed' — pending = not yet logged
type MedicineColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink'

// ── Core interfaces ─────────────────────────────────────────────────────────
interface Medicine {
  id: string                   // crypto.randomUUID()
  name: string                 // e.g. "BRILINTA 90"
  dosage: string               // combined "amount unit" string, e.g. "90 mg", "1 tablet"
                               // entered via split UI: numeric amount + unit dropdown
  mealRelation: MealRelation
  schedules: MedicineSchedule[]  // { time: TimeSlot; hour: number; minute: number }
  color: MedicineColor
  notes?: string
  active: boolean              // soft-delete: false = archived
  createdAt: string            // ISO datetime string
}

interface DoseLog {
  id: string
  medicineId: string
  scheduledDate: string        // "YYYY-MM-DD"
  scheduledTime: TimeSlot
  status: DoseStatus
  markedAt?: string            // ISO datetime; undefined when status = 'pending'
  note?: string                // optional skip reason or free-text
  // markedBy: Phase 3 — caretaker multi-user attribution
}

interface AppSettings {
  id: 1                        // singleton row
  patientName: string          // shown in export headers; default "Patient"
  reminderTimes: Record<TimeSlot, string>  // { morning: '08:00', noon: '13:00', evening: '18:00', night: '21:00' }
  notificationsEnabled: boolean
  // caretakerName / activeUser: Phase 3 (multi-user sync)
}
```

**Dexie schema (version 2):**
```
medicines:  &id, active
doseLogs:   &id, [medicineId+scheduledDate], scheduledDate, medicineId
settings:   &id
```
Version 2 adds a standalone `medicineId` index to `doseLogs` for efficient cascade-delete.

**Dosage unit options** (enforced in MedicineForm, stored as combined string):
`mg | mcg | g | ml | drops | IU | puff | tablet | capsule | %`

---

## 6. Domain Layer

Pure functions in `src/domain/` — zero React, Dexie, or UI imports. These form the nucleus of `packages/core` in Phase 2 and are testable with Vitest without a browser.

```typescript
// src/domain/scheduling.ts
getDailySlots(medicines: Medicine[], date: string, logs: DoseLog[]): DoseSlot[]
// Returns one DoseSlot per medicine×schedule combination for the given date,
// attaching the matching DoseLog (or null if not yet logged).

getMissedDoses(logs: DoseLog[], asOf: Date): DoseLog[]
// Returns pending logs where scheduledDate < today (last 7 days window applied in Today.tsx)

// src/domain/export.ts
buildGridData(medicines: Medicine[], logs: DoseLog[], dateRange: DateRange): GridRow[]
// Builds a T/S/– grid; taken overrides skipped for the same medicine+date
```

`getAdherence()` is planned but not yet implemented (Phase 3 analytics).

---

## 7. State Management

| State type | Owner | Examples |
|------------|-------|---------|
| Domain / server state | TanStack Query v5 | medicines list, dose logs, settings |
| UI / ephemeral state | Zustand v5 | active date, toast queue, missed-banner dismissed |

TanStack Query hooks (`src/hooks/`) wrap repository methods as `queryFn`. Mutations call `queryClient.invalidateQueries` on success. In Phase 2, only `queryFn` changes — cache behaviour, loading states, and optimistic updates are identical.

Zustand store (`src/store/useUIStore.ts`) holds:
- `activeDate` — currently viewed date (string `YYYY-MM-DD`)
- `toasts` — toast queue with `id, message, type`
- `missedBannerDismissed` — session-scoped banner hide flag
- `isOnline` — online/offline status (driven by `useOnlineStatus` hook)

---

## 8. Design System — Warm Precision

Applied via Tailwind CSS v4 `@theme` directive in `src/index.css`. Overrides the entire gray palette with warm variants and adds semantic status tokens.

| Token | Value | Use |
|-------|-------|-----|
| `gray-50` | `#F7F6F3` | App background |
| `gray-100` | `#EFEDE8` | Card backgrounds, skeletons |
| `gray-900` | `#1C1C1A` | Primary text |
| `taken` / `taken-surface` / `taken-border` | green scale | Dose taken states |
| `skipped` / `skipped-surface` / `skipped-border` | red scale | Dose skipped states |

**Visual conventions:**
- 3 px left colour accent bar on every medicine card
- `rounded-2xl` for cards; `rounded-t-3xl sm:rounded-3xl` for bottom sheets and modals
- `backdropFilter: blur(2px)` on all overlays
- Drag handle (`w-9 h-1 bg-gray-200 rounded-full`) on all mobile bottom sheets
- 11 px bold uppercase tracking-widest for section headers
- System font stack (`ui-sans-serif, system-ui, -apple-system`)
- `user-select: none` and `-webkit-tap-highlight-color: transparent` on interactive elements

---

## 9. Notification Architecture

**Phase 1 (no backend) — `src/services/notifications.ts`:**

Implemented as a `NotificationService` class singleton with named bound exports (prevents `this` binding issues in callbacks):

```typescript
class NotificationService {
  scheduleToday(medicines, settings, now?): void
  // Clears previous timeouts; computes delay to each slot;
  // fires via ServiceWorkerRegistration.showNotification() (not deprecated new Notification())
  
  sendTestNotification(): Promise<void>
  // Uses SW registration; falls back to new Notification() only if no SW registered
  
  clearScheduled(): void
  computeDelayMs(hour, minute, now): number | null
  requestPermission(): Promise<NotificationPermission>
}

export const scheduleToday = _service.scheduleToday.bind(_service)
export const sendTestNotification = _service.sendTestNotification.bind(_service)
// etc.
```

Rescheduled on `visibilitychange` and app mount. SW handles `notificationclick` → `clients.openWindow('/')`.

**Phase 1 limitation:** Requires app to have been opened at least once that day.

**Phase 2 upgrade path (see S2-6):**
- Register VAPID push subscription (2 lines)
- Supabase Edge Function cron sends Web Push; SW `push` event handler already in place
- Remove `setTimeout` dependency entirely

---

## 10. PWA / Offline Strategy

Service worker (`src/sw.ts`) managed by vite-plugin-pwa (injectManifest mode):

- `precacheAndRoute(self.__WB_MANIFEST)` — all app assets cached at install
- `StaleWhileRevalidate` for fonts and icons
- Navigation fallback → `index.html` (SPA routing)
- `push` + `notificationclick` event handlers

Netlify deployment headers (`netlify.toml`):
- `sw.js` and `index.html`: `Cache-Control: no-cache` (always fresh)
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (content-hashed)

---

## 11. Project Structure (v1.0.0)

```
medicine-tracker/
├── docs/
│   ├── architecture.md          ← this file
│   ├── design-system.md         ← full Warm Precision token reference
│   ├── prd-1-core-features.md
│   ├── prd-2-mobile-migration.md
│   └── prd-3-remaining-features.md
├── public/
│   ├── manifest.webmanifest
│   ├── _redirects               ← Netlify SPA fallback
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── sw.ts                    ← service worker (precache, push, notificationclick)
│   ├── main.tsx
│   ├── App.tsx                  ← router + QueryClientProvider + RepositoryContext + ErrorBoundary
│   ├── index.css                ← Tailwind v4 @theme (Warm Precision tokens)
│   ├── types/
│   │   └── index.ts             ← all interfaces + Zod schemas + DEFAULT_SETTINGS
│   ├── domain/
│   │   ├── scheduling.ts        ← getDailySlots, getMissedDoses
│   │   └── export.ts            ← buildGridData
│   ├── repositories/
│   │   ├── types.ts             ← IMedicineRepository, IDoseLogRepository, ISettingsRepository
│   │   └── dexie/
│   │       ├── db.ts            ← Dexie instance, schema versions 1+2
│   │       ├── MedicineRepository.ts
│   │       ├── DoseLogRepository.ts
│   │       └── SettingsRepository.ts
│   ├── context/
│   │   └── RepositoryContext.tsx ← React DI context; provides all three repo implementations
│   ├── services/
│   │   ├── notifications.ts     ← NotificationService class + bound named exports
│   │   └── export.ts            ← downloadPDF(), downloadExcel()
│   ├── hooks/
│   │   ├── useMedicines.ts      ← useQuery + useSaveMedicine + useArchiveMedicine
│   │   ├── useDoseLogs.ts       ← useDoseLogsForDate + useDoseLogsForRange + useUpsertDoseLog
│   │   ├── useSettings.ts       ← useSettings + useUpdateSettings
│   │   └── useOnlineStatus.ts   ← navigator.onLine + online/offline events → Zustand
│   ├── store/
│   │   └── useUIStore.ts        ← Zustand: activeDate, toasts, missedBannerDismissed, isOnline
│   ├── components/
│   │   ├── DateNav.tsx          ← ← [Day of week / Full date] → with "Today" label
│   │   ├── DoseActionModal.tsx  ← long-press bottom sheet: Taken / Skipped + note
│   │   ├── DoseChip.tsx         ← standalone chip (used in future Phase 2 views)
│   │   ├── ErrorBoundary.tsx    ← class component wrapping <Outlet />
│   │   ├── MedicineCard.tsx     ← medicine list card with 3 px colour bar
│   │   ├── MedicineForm.tsx     ← add/edit bottom sheet: structured dosage, slot picker, colour
│   │   ├── MissedDoseBanner.tsx ← banner + sheet with inline Taken/Skip actions
│   │   └── ToastStack.tsx       ← pill toasts with colour accent dots
│   ├── pages/
│   │   ├── Today.tsx            ← slot-grouped dose grid (MedicineSlotCard inline component)
│   │   ├── Medicines.tsx        ← medicine list + archive confirmation sheet
│   │   ├── Settings.tsx         ← profile, reminder times, notification toggle + test button
│   │   └── Export.tsx           ← date range + presets + PDF/Excel download
│   └── test/
│       ├── setup.ts             ← jsdom + @testing-library/jest-dom setup
│       ├── scheduling.test.ts
│       ├── export.test.ts
│       ├── notifications.test.ts
│       ├── types.test.ts
│       ├── MedicineRepository.test.ts
│       ├── DoseLogRepository.test.ts
│       ├── SettingsRepository.test.ts
│       ├── MedicineForm.test.tsx
│       ├── MissedDoseBanner.test.tsx
│       └── smoke.test.tsx
├── netlify.toml
├── CHANGELOG.md
├── TESTING.md
├── vite.config.ts
└── package.json
```

---

## 12. Phase 2 Migration Path

See GitHub issues [#21–#29](https://github.com/navneetvishwakarma/medicine-tracker/issues) for the full Phase 2 plan.

```
Phase 1 (current):
  Single flat web app — Dexie as storage, no auth

Phase 2 target:
  monorepo/
  ├── packages/
  │   └── core/                    ← types, domain fns, repo interfaces, TanStack Query hooks
  ├── apps/
  │   ├── web/                     ← current app + SupabaseMedicineRepository
  │   └── mobile/                  ← Expo app + expo-sqlite repository implementations
  └── supabase/
      ├── migrations/              ← schema + RLS
      └── functions/
          └── send-reminders/      ← Edge Function: cron push notifications
```

**Migration sequence (matching Phase 2 GitHub issues):**

| Issue | Story | What changes |
|-------|-------|-------------|
| #21 | S2-1 | Repo → monorepo; `packages/core` extraction |
| #22 | S2-2 | Supabase project, schema, Auth (email + Google), RLS |
| #23 | S2-3 | `SupabaseMedicineRepository` etc.; swap DI context |
| #24 | S2-4 | IndexedDB → Supabase one-tap migration on first sign-in |
| #25 | S2-5 | Supabase Realtime → live dose sync; `markedBy` badge |
| #26 | S2-6 | Edge Function cron push; VAPID web push; remove setTimeout |
| #27 | S2-7 | Viewer role via invite code; read-only route guards |
| #28 | S2-8 | Expo app: all screens, expo-sqlite, haptics |
| #29 | S2-9 | Native push (APNs/FCM); App Store + Google Play |

---

## 13. Key Decisions Log

| Decision | Choice | Rejected | Reason |
|----------|--------|----------|--------|
| Web storage | IndexedDB / Dexie | wa-sqlite | Bundle size, no COOP/COEP needed, same Phase 2 story |
| Phase 1 platform | React 19 web | Expo web | Expo web is second-class; mobile alignment via Repository pattern |
| Domain state | TanStack Query v5 | Zustand for domain | Treats local DB as a server; Phase 2 pivot is one-line per entity |
| Phase 2 mobile | Expo + monorepo | Separate RN app | Maximum code reuse via `packages/core` |
| Auth | None in Phase 1 | Firebase / Supabase | Validate product before adding auth complexity |
| Backend | None in Phase 1 | Supabase | Offline-first; backend added when sync is required |
| Boolean index | `.filter()` cursor | `.where().equals(1)` | fake-indexeddb doesn't coerce boolean → 1; filter works everywhere |
| Notification API | SW `showNotification()` | `new Notification()` | Deprecated in Chrome when SW is active; SW approach is spec-correct |
| Dosage input | Amount + unit split | Free text string | Prevents invalid formats; unit enum enables export formatting |
| CSS approach | Tailwind v4 `@theme` | CSS variables + raw classes | Warm gray override without touching component classes |
