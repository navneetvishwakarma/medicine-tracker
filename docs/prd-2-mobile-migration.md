# PRD 2 — Mobile App & Cloud Sync (Phase 2)

**Product:** Medicine Tracker  
**Version:** 1.0  
**Date:** 2026-05-18  
**Status:** Draft — contingent on Phase 1 traction  
**Owner:** Product / Engineering

---

## 1. Problem Statement

Phase 1 users rely on a web PWA, which has two hard limitations:

1. **Notifications stop if the app isn't opened that day** — critical reminders are silently dropped when caregivers are busy.
2. **Data is device-local** — if the phone is lost, or a second caregiver uses a different device, logs are siloed.

Phase 2 resolves both with a backend (Supabase) and a native mobile app (Expo), while sharing all business logic from Phase 1 via a `packages/core` monorepo extraction.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| True background push notifications | Reminders delivered even when app is closed, ≥95% delivery rate |
| Multi-device sync | Same data visible on web and mobile within 5 seconds |
| Native mobile app | Available on iOS App Store + Google Play |
| Zero regression on web | All Phase 1 features work identically post-migration |

## 3. Non-Goals (Phase 2)

- Doctor portal / shareable links
- Prescription OCR / camera intake
- Medication interaction checking
- Enterprise / clinic multi-tenant
- Billing or subscriptions

---

## 4. Users

Same personas as Phase 1, plus:

| Persona | Description |
|---------|-------------|
| Mobile Caretaker | Uses native iOS/Android app instead of web browser |
| Remote Family Member | Views (read-only) dose log from a separate device |

---

## 5. User Stories

### 5.1 Native Mobile App

**US-1.1**
> As a caretaker, I want a native iOS/Android app, so I get a smoother experience and reliable home screen presence.

**Acceptance Criteria:**
- App available on App Store and Google Play
- Native navigation gestures (swipe back, tab bar)
- Same feature set as Phase 1 web app
- Haptic feedback on dose marking

---

**US-1.2**
> As a caretaker, I want true background push notifications, so I receive reminders even if I haven't opened the app that day.

**Acceptance Criteria:**
- Push notification delivered within 60s of scheduled time regardless of app state
- Notification payload: slot name + list of due medicines
- Tap → deep link to today's home screen
- Notification permission requested on first app launch

**Technical:** Supabase Edge Function reads today's schedules at scheduled times, sends APNs/FCM push via Expo Push Notifications API.

---

**US-1.3**
> As a caretaker, I want web push notifications to also work reliably on the web app, so browser users have the same experience.

**Acceptance Criteria:**
- VAPID-based Web Push subscription registered on web app
- Same Supabase Edge Function sends to both mobile and web subscribers
- No `setTimeout` dependency for web reminders

---

### 5.2 Cloud Sync & Multi-Device

**US-2.1**
> As a caretaker, I want my data to sync across my phone and my family member's phone, so we both see up-to-date dose logs.

**Acceptance Criteria:**
- Any dose log change on one device visible on another within 5 seconds
- Conflict resolution: last-write-wins per `DoseLog.id`
- Offline changes queued and synced when connectivity returns

---

**US-2.2**
> As a caretaker, I want my data backed up to the cloud, so I don't lose records if my phone is replaced.

**Acceptance Criteria:**
- All medicines, dose logs, and settings synced to Supabase
- On fresh install + login: full data restored within 30 seconds
- Local IndexedDB (web) / expo-sqlite (native) used as offline cache

---

**US-2.3**
> As a remote family member, I want read-only access to the dose log, so I can check on a parent's adherence without needing to mark doses.

**Acceptance Criteria:**
- Separate "Viewer" role in settings; limited to read-only today + history screens
- No access to medicine management or settings
- Access granted by Primary Caretaker via invite code or shared link

---

### 5.3 Authentication

**US-3.1**
> As a caretaker, I want to sign in with email/password or Google, so my data is protected and tied to my identity.

**Acceptance Criteria:**
- Auth via Supabase Auth (email + Google OAuth)
- Session persists across app restarts
- Sign-out clears local cache
- Row-Level Security: users only access their own family's data

---

**US-3.2**
> As a caretaker, I want my Phase 1 local data migrated to my new account, so I don't lose history when I first sign in.

**Acceptance Criteria:**
- On first sign-in, app detects existing local IndexedDB data
- Migration prompt: "We found local data. Import to your account?"
- One-tap import: local data upserted to Supabase

---

### 5.4 Real-Time Updates

**US-4.1**
> As a caretaker, I want to see dose updates from another caretaker in real time, so I don't double-dose a patient.

**Acceptance Criteria:**
- If Caretaker 2 marks a dose, Caretaker 1's screen updates within 5 seconds without refresh
- Optimistic update shown immediately on marking device; rolled back if sync fails
- `markedBy` badge visible on chip showing who marked it

---

## 6. Architecture Changes

### Monorepo Extraction

```
medicine-tracker/                   (current flat structure)
↓
monorepo/
├── packages/
│   └── core/
│       ├── src/types/              ← moved from apps/web/src/types/
│       ├── src/domain/             ← moved from apps/web/src/domain/
│       ├── src/repositories/types.ts
│       └── src/hooks/              ← TanStack Query hooks (queryFn only changes)
├── apps/
│   ├── web/                        ← existing React app
│   │   └── src/repositories/supabase/   ← new: SupabaseMedicineRepository
│   └── mobile/                     ← new: Expo app
│       └── src/repositories/sqlite/    ← expo-sqlite implementations
└── supabase/
    ├── migrations/
    └── functions/
        └── send-reminders/         ← Edge Function: scheduled push notifications
```

### Storage Swap (zero component changes)

```typescript
// Phase 1 DI context provides:
DexieMedicineRepository → implements IMedicineRepository

// Phase 2 DI context provides:
SupabaseMedicineRepository → implements IMedicineRepository
// Dexie stays as offline cache, synced by TanStack Query
```

### Supabase Schema

```sql
medicines (id, user_id, name, dosage, meal_relation, schedules, color, notes, active, created_at)
dose_logs (id, user_id, medicine_id, scheduled_date, scheduled_time, status, marked_at, marked_by, note)
settings  (id, user_id, reminder_times, notifications_enabled, patient_name, caretaker_name)
push_subscriptions (id, user_id, endpoint, keys, platform)  -- web VAPID + Expo tokens
```

Row-Level Security: all tables filtered by `user_id = auth.uid()`.

---

## 7. Push Notification Architecture

```
Supabase Edge Function (cron: every 15 min)
  → read today's medicines + reminder_times for all users
  → for each due slot: send via Expo Push API (APNs + FCM) + Web Push (VAPID)
  → log delivery status
```

No `setTimeout`. No "app must be open" limitation.

---

## 8. Migration Checklist

- [ ] Extract `packages/core` from `apps/web/src`
- [ ] Create Supabase project + apply migrations
- [ ] Implement `SupabaseMedicineRepository` + `SupabaseDoseLogRepository`
- [ ] Add Supabase Auth (email + Google OAuth)
- [ ] Add Row-Level Security policies
- [ ] Add real-time subscription → `queryClient.invalidateQueries`
- [ ] Register VAPID push subscription in web app (2 lines in `notifications.ts`)
- [ ] Deploy Supabase Edge Function `send-reminders`
- [ ] Build Expo app (React Native 0.78 / React 19)
- [ ] Add `expo-sqlite` repository implementations
- [ ] Implement local data migration flow (IndexedDB → Supabase on first login)
- [ ] App Store + Google Play submissions
- [ ] E2E tests: multi-device sync, offline queue, push delivery

---

## 9. Acceptance Test Plan

| # | Scenario | Expected Result |
|---|----------|----------------|
| T1 | Close app entirely; wait for reminder time | Push notification received on device |
| T2 | Mark dose on web; open mobile | Dose shown as taken within 5s |
| T3 | Mark dose offline; regain network | Dose synced to Supabase within 10s |
| T4 | Fresh install; sign in | All historical data restored |
| T5 | Sign in with existing local data | Migration prompt shown; data imports correctly |
| T6 | Viewer role signs in | Can view logs; cannot add/edit medicines |
| T7 | Two devices mark same dose simultaneously | One wins; no duplicate; `markedBy` correct |
