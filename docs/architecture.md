# Medicine Tracker — Architecture Document

**Version:** 1.0  
**Date:** 2026-05-18  
**Status:** Approved

---

## 1. System Overview

Medicine Tracker is an offline-first Progressive Web App (PWA) that helps patients manage and track their own daily medication adherence. It replaces a paper-based grid tracker with a digital equivalent that works without internet, sends local reminders, and exports data to PDF/Excel.

Phase 1 primary user: **patient**. Caretaker multi-user support (markedBy attribution, active-user toggle, caretaker sync) is Phase 3.

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

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 19 + TypeScript | Concurrent rendering, Actions API, clean Phase 2 extraction |
| Build | Vite 8 | Sub-second HMR, native ESM, best-in-class PWA plugin |
| Styling | Tailwind CSS v4 + shadcn/ui | Zero runtime CSS, accessible primitives, no design system overhead |
| Storage | Dexie.js v4 (IndexedDB) | 35KB, typed, devtools support, no COOP/COEP headers required |
| Domain state | TanStack Query v5 | `queryFn = Dexie` → `queryFn = Supabase` in Phase 2, zero component changes |
| UI state | Zustand | Sidebar, filters, toasts — never domain state |
| PWA | vite-plugin-pwa (injectManifest) | Custom service worker, full precaching, push event handling |
| Routing | React Router v7 | File-based routes, future-compatible with RSC |
| Validation | Zod | Shared with Phase 2 `packages/core` |
| Dates | date-fns | Tree-shakeable, no Moment.js overhead |
| Export | jsPDF + SheetJS | Client-side PDF + Excel, no server dependency |

**Why not wa-sqlite?** Bundle is ~800KB gzipped vs Dexie's 35KB. Requires COOP/COEP headers that break auth iframes. React Native Phase 2 uses `expo-sqlite` (native C binding) — web WASM gives zero carryover. IndexedDB is what Figma, Notion, and Slack use.

**Why not Expo from day 1?** Expo web is second-class in their own docs, adds 2–3 weeks of config (Metro, EAS, Gradle/Xcode), and if Phase 2 never ships the cost is pure waste. The Repository pattern, not the UI framework, enables mobile alignment.

---

## 4. Repository Pattern (Core Architecture)

Every component reads/writes through repository interfaces. No component imports Dexie directly.

```
src/repositories/
├── types.ts                        ← interfaces (IMedicineRepository, IDoseLogRepository)
└── dexie/
    ├── db.ts                       ← Dexie instance + schema
    ├── MedicineRepository.ts       ← implements IMedicineRepository
    └── DoseLogRepository.ts        ← implements IDoseLogRepository
```

**Phase 1:**
```typescript
interface IMedicineRepository {
  getAll(): Promise<Medicine[]>
  getById(id: string): Promise<Medicine | undefined>
  save(medicine: Medicine): Promise<void>
  delete(id: string): Promise<void>
}
// Provided via React context: DexieMedicineRepository
```

**Phase 2 — drop-in swap:**
```typescript
// Just register SupabaseMedicineRepository in the DI context.
// Zero component changes.
class SupabaseMedicineRepository implements IMedicineRepository { ... }
```

---

## 5. Data Model

```typescript
type TimeSlot     = 'morning' | 'noon' | 'evening' | 'night'
type MealRelation = 'before' | 'after' | 'with' | 'none'
type DoseStatus   = 'pending' | 'taken' | 'missed' | 'skipped'

interface Medicine {
  id: string                   // crypto.randomUUID()
  name: string                 // "BRILINTA 90"
  dosage: string               // "90mg"
  mealRelation: MealRelation
  schedules: { time: TimeSlot; hour: number; minute: number }[]
  color: string                // Tailwind color token
  notes?: string
  active: boolean              // soft delete
  createdAt: string            // ISO date string
}

interface DoseLog {
  id: string
  medicineId: string
  scheduledDate: string        // "YYYY-MM-DD"
  scheduledTime: TimeSlot
  status: DoseStatus
  markedAt?: string
  // markedBy: Phase 3 (caretaker multi-user sync)
  note?: string
}

interface AppSettings {
  id: 1                        // singleton row
  patientName: string
  reminderTimes: Record<TimeSlot, string>
  notificationsEnabled: boolean
  // caretakerName / activeUser: Phase 3 (multi-user sync)
}
```

**Dexie indexes:**
```
medicines:  &id, active
doseLogs:   &id, [medicineId+scheduledDate], scheduledDate
settings:   &id
```

---

## 6. Domain Layer

Pure functions in `src/domain/` — zero React, Dexie, or UI imports. These are the nucleus of `packages/core` in Phase 2 and testable with vitest without a browser.

```typescript
// src/domain/scheduling.ts
getDailySlots(medicines: Medicine[], date: string): DoseSlot[]
getMissedDoses(logs: DoseLog[], asOf: Date): DoseLog[]
getAdherence(logs: DoseLog[], from: string, to: string): number  // 0.0–1.0

// src/domain/export.ts
buildGridData(medicines: Medicine[], logs: DoseLog[], dateRange: DateRange): GridRow[]
```

---

## 7. State Management

| State type | Owner | Examples |
|------------|-------|---------|
| Domain/server state | TanStack Query | medicines list, dose logs, settings |
| UI/ephemeral state | Zustand | sidebar open, active date filter, toast queue |

TanStack Query hooks (`src/hooks/`) call repository methods as `queryFn`. Mutations invalidate the relevant query keys, triggering re-renders. In Phase 2, only `queryFn` changes — cache behavior, loading states, and optimistic updates are identical.

---

## 8. Notification Architecture

**Phase 1 (no backend):**
1. `Notification.requestPermission()` on first meaningful interaction
2. On app foreground (`visibilitychange` + app load): read today's schedules from IndexedDB
3. Schedule `setTimeout` chains → `registration.showNotification()` via Service Worker
4. Service Worker handles `notificationclick` → `clients.openWindow('/')`

**Limitation:** Notifications require app to have been opened at least once that day. True background push is Phase 2.

**Phase 2 upgrade (two-line change):**
- Register VAPID push subscription
- Supabase Edge Function sends Web Push at scheduled times
- SW `push` event handler already exists — no new code needed

---

## 9. PWA / Offline Strategy

Service worker (`src/sw.ts`) managed by vite-plugin-pwa (injectManifest mode):

- `precacheAndRoute(self.__WB_MANIFEST)` — all app assets cached at install
- `StaleWhileRevalidate` for fonts and icons
- Navigation fallback → `index.html` (SPA routing)
- `push` + `notificationclick` event handlers

Result: full offline functionality. App opens from cache with zero network. All data in IndexedDB survives restarts.

---

## 10. Project Structure

```
medicine-tracker/
├── docs/                          ← architecture + PRDs
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── src/
│   ├── sw.ts                      ← service worker (push, cache, notificationclick)
│   ├── main.tsx
│   ├── App.tsx                    ← router + QueryClientProvider + Repository DI context
│   ├── types/index.ts             ← all interfaces + Zod schemas
│   ├── domain/
│   │   ├── scheduling.ts
│   │   └── export.ts
│   ├── repositories/
│   │   ├── types.ts
│   │   └── dexie/
│   │       ├── db.ts
│   │       ├── MedicineRepository.ts
│   │       └── DoseLogRepository.ts
│   ├── services/
│   │   ├── notifications.ts
│   │   └── export.ts
│   ├── hooks/
│   │   ├── useMedicines.ts
│   │   ├── useDoseLogs.ts
│   │   └── useSettings.ts
│   ├── store/
│   │   └── useUIStore.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── DoseChip.tsx
│   │   ├── DoseRow.tsx
│   │   ├── DateNav.tsx
│   │   └── MedicineForm.tsx
│   └── pages/
│       ├── Today.tsx
│       ├── Medicines.tsx
│       ├── Settings.tsx
│       └── Export.tsx
└── vite.config.ts
```

---

## 11. Phase 2 Migration Path

```
Phase 1 (current):
  Single web app — Dexie as storage

Phase 2:
  monorepo/
  ├── packages/
  │   └── core/                    ← types, domain fns, repo interfaces, TanStack Query hooks
  ├── apps/
  │   ├── web/                     ← current app + SupabaseMedicineRepository
  │   └── mobile/                  ← Expo app + expo-sqlite repository impl
  └── package.json                 ← workspaces
```

Migration checklist:
- [ ] Move `src/types/`, `src/domain/`, `src/repositories/types.ts`, `src/hooks/` → `packages/core`
- [ ] Add `SupabaseMedicineRepository` + `SupabaseDoseLogRepository`
- [ ] Add Supabase real-time subscription → `queryClient.invalidateQueries`
- [ ] Add VAPID push subscription registration (2 lines in `src/services/notifications.ts`)
- [ ] Build Expo app importing from `@medicine-tracker/core`
- [ ] Add `expo-sqlite` repository implementations

---

## 12. Key Decisions Log

| Decision | Choice | Rejected | Reason |
|----------|--------|----------|--------|
| Web storage | IndexedDB / Dexie | wa-sqlite | Bundle size, no COOP/COEP needed, same Phase 2 story |
| Phase 1 platform | React 19 web | Expo web | Expo web is second-class; mobile alignment via Repository pattern |
| Domain state | TanStack Query v5 | Zustand | Treats local DB as a server; Phase 2 pivot is one-line per entity |
| Phase 2 mobile | Expo + monorepo | Separate RN app | Maximum code reuse via `packages/core` |
| Auth | None in Phase 1 | Firebase/Supabase | Validate product before adding auth complexity |
| Backend | None in Phase 1 | Supabase | Offline-first; backend added when sync is required |
