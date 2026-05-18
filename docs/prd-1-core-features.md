# PRD 1 — Core Features (Phase 1: Web PWA)

**Product:** Medicine Tracker
**Version:** 1.1 (updated to reflect shipped implementation)
**Date:** 2026-05-18
**Status:** ✅ Shipped — v1.0.0 (2026-05-18)
**Owner:** Product / Engineering

---

## 1. Problem Statement

A patient manages their own daily medications on paper — a grid of medicine names vs dates, hand-filled with T (taken) / S (skipped) / blank (missed). This process has no reminders, no history search, is prone to loss, and can't be shared digitally with a doctor.

---

## 2. Goals

| Goal | Metric | Status |
|------|--------|--------|
| Replace paper tracker digitally | 100% of daily doses loggable without paper | ✅ |
| Works without internet | App fully functional in airplane mode | ✅ |
| Reduce missed doses | Patient receives reminder notifications per scheduled slot | ✅ |
| Enable doctor-ready export | Grid export matching paper format in ≤3 taps | ✅ |

## 3. Non-Goals (Phase 1)

- Multi-user / multi-device sync → Phase 2
- Cloud backup → Phase 2
- Photo upload of medicines
- Prescription management / refill tracking → Phase 3
- Doctor portal → Phase 3

---

## 4. Users

| Persona | Phase | Description |
|---------|-------|-------------|
| **Patient** | Phase 1 (primary) | Manages their own medicines, marks doses taken/skipped, receives reminders |
| Caretaker | Phase 3 | Invited by patient; marks doses on patient's behalf; requires multi-user sync |

---

## 5. User Stories

### 5.1 Daily Dose Tracking

**US-1.1** ✅
> As a patient, I want to see all of today's medicines organized by time slot (Morning / Noon / Evening / Night), so I know exactly what to take and when.

**Acceptance Criteria (as shipped):**
- Home screen shows current date with ← / → day navigation; "Day of week" as primary label, full date as secondary
- Medicines are **grouped by time slot** (not row-per-medicine). Each slot section (Morning / Noon / Evening / Night) shows its scheduled time and lists all medicines due in that window
- The currently active time slot is highlighted with a "Now" badge (computed from reminder times ±30 min window)
- Completed slots show a "✓ All done" indicator when every medicine in that slot is marked taken
- Each medicine appears as a card with: 3 px left colour accent bar, name, dosage · meal-relation subtitle, status pill (Pending / Taken / Skipped)

---

**US-1.2** ✅
> As a patient, I want to tap a dose to mark it as taken, so I can log a dose in one interaction.

**Acceptance Criteria:**
- Tap the status pill → toggles Pending ↔ Taken
- Change persists to IndexedDB immediately with `markedAt` timestamp
- Visual feedback: pill turns green with ✓ icon

---

**US-1.3** ✅
> As a patient, I want to long-press a dose to mark it as skipped and optionally add a reason, so the doctor can see why a dose was missed.

**Acceptance Criteria:**
- Long-press (480 ms) on the status pill opens a bottom sheet (`DoseActionModal`)
- Bottom sheet options: Mark Taken / Mark Skipped / Add note field (optional free text, max 200 chars)
- Skipped status shown in red

---

**US-1.4** ✅
> As a patient, I want to see a banner for missed doses from previous days, so I don't lose track of gaps.

**Acceptance Criteria (as shipped):**
- On app load: if any dose from prior 7 days has `status = pending` and `scheduledDate < today`, a dismissible banner appears showing the count and the first medicine's name as a preview
- Tapping the banner opens a bottom sheet listing all missed doses (medicine name, date, slot)
- Each missed dose item has inline **Taken** and **Skip** buttons — no navigation to the historical date
- Tapping × on the banner dismisses it for the current session

---

### 5.2 Medicine Management

**US-2.1** ✅
> As a patient, I want to add a new medicine with its name, dosage, schedule, and meal relation, so the app knows when to remind me and what to log.

**Acceptance Criteria (as shipped):**
- Form fields: name (required, max 100 chars), dosage (required — split into numeric **amount** field + **unit** dropdown: `mg, mcg, g, ml, drops, IU, puff, tablet, capsule, %`), time slots (multi-select: Morning/Noon/Evening/Night with per-slot HH:MM picker), meal relation (Before/After/With/None), colour (8 presets), notes (optional, max 500 chars)
- Dosage stored as combined string: `"90 mg"`, `"1 tablet"`, `"5 ml"`, etc.
- Validation via Zod: name required, dosage amount must be a valid number, at least one slot required
- Saved to IndexedDB; appears in today's grid immediately

---

**US-2.2** ✅
> As a patient, I want to edit a medicine's details, so I can update it if the prescription changes.

**Acceptance Criteria:**
- Edit opens the same bottom-sheet form pre-filled; existing dosage string is parsed back into amount + unit for the split UI
- Changes take effect from the current date (historical logs unaffected)
- Success toast on save

---

**US-2.3** ✅
> As a patient, I want to archive (soft-delete) a medicine, so it no longer appears in daily tracking but remains in historical exports.

**Acceptance Criteria:**
- Archive confirmation shown as a bottom sheet (no native `confirm()` dialog)
- Archived medicines: `active = false`; hidden from today's grid
- Historical dose logs for archived medicines still appear in exports

---

### 5.3 Settings

**US-3.1** ✅
> As a patient, I want to set global reminder times for each slot, so all medicines in that slot fire at the same time.

**Acceptance Criteria:**
- Settings page: time picker per slot (Morning / Noon / Evening / Night)
- **Defaults: 08:00 / 13:00 / 18:00 / 21:00**
- Changing a time reschedules all pending notifications for that slot

---

**US-3.2** ✅
> As a patient, I want to set my name, so exports show accurate attribution.

**Acceptance Criteria:**
- Field: Patient Name (required, max 100 chars); default "Patient" on first launch
- Name shown in export PDF/Excel header

> **Note:** Caretaker name and active-user toggle are Phase 3 features (multi-user sync required).

---

**US-3.3** ✅
> As a patient, I want to enable/disable notifications and test them, so I can verify they work on my device before relying on them.

**Acceptance Criteria:**
- Toggle: Notifications On/Off; on enable, `Notification.requestPermission()` is called
- "Send test notification" button fires via `ServiceWorkerRegistration.showNotification()` (spec-correct; `new Notification()` deprecated in SW-controlled pages)
- Button shows toast "Enable notifications first" if permission not yet granted
- If permission denied: inline guidance toast to enable in browser settings

---

### 5.4 Notifications

**US-4.1** ✅
> As a patient, I want to receive a browser notification at each medicine's scheduled time, so I'm reminded even if the app isn't open on screen.

**Acceptance Criteria:**
- Notification fires within ±60 seconds of scheduled time (setTimeout-based; see limitation)
- Title: "Medicine Reminder"; Body: list of medicines due in that slot + dosage
- Tap → opens app to today's home screen
- Rescheduled on every `visibilitychange` (app brought to foreground)

**Known Limitation:** Notifications require the app to have been opened at least once that day (no backend in Phase 1). Documented in Settings UI subtitle: "Requires app opened at least once daily". Phase 2 (S2-6) replaces this with true background push via Supabase Edge Function + VAPID.

---

### 5.5 Export

**US-5.1** ✅
> As a patient, I want to export a date range as a PDF grid, so I can hand it to the doctor at an appointment.

**Acceptance Criteria (as shipped):**
- Export page: **quick-select presets** (Last 7 days, Last 30 days, This month, Last month) + manual date pickers; active preset highlighted
- Maximum range: **31 days**
- PDF: landscape A4, header = patient name + date range
- Grid: medicine rows × date columns; cells = T / S / – (Taken/Skipped/Pending)
- For ranges ≤14 days: column headers are "MM-DD"; for ranges >14 days: day-number-only ("1"–"31") with tighter cell padding for legibility
- Download triggered client-side; no server required

---

**US-5.2** ✅
> As a patient, I want to export raw dose logs to Excel, so I can filter and analyze adherence data myself.

**Acceptance Criteria:**
- Excel download: two sheets
  - Sheet 1 "Log": all DoseLog fields, filterable
  - Sheet 2 "Grid": same layout as PDF grid
- File named: `medicine-log-YYYY-MM-DD-YYYY-MM-DD.xlsx`
- Same date range and presets as PDF

---

### 5.6 PWA / Offline

**US-6.1** ✅
> As a patient, I want the app to work fully without internet, so I can use it in areas with no signal.

**Acceptance Criteria:**
- App loads from cache when offline (full precache via vite-plugin-pwa)
- All dose marking, medicine management, and settings work offline
- Online/Offline toast shown on connectivity change
- No data loss when connectivity is restored

**US-6.2** ✅
> As a patient, I want to install the app on my phone's home screen, so it opens like a native app.

**Acceptance Criteria:**
- Valid `manifest.webmanifest` with name "Medicine Tracker", short_name "MedTracker", icons (192×192, 512×512), `theme_color: "#0f172a"`, `display: standalone`
- "Add to Home Screen" prompt triggered by browser on eligible visits
- Installed app runs in standalone display mode (no browser chrome)

---

## 6. Out of Scope

- Cloud sync or multi-device support → PRD 2 (S2-3)
- Native iOS / Android app → PRD 2 (S2-8)
- Authentication → PRD 2 (S2-2)
- Caretaker multi-user mode (`markedBy`, double-dose warning) → PRD 2 (S2-5) / PRD 3
- Biometric / PIN lock → PRD 3
- Refill reminders / stock tracking → PRD 3
- Analytics dashboard → PRD 3

---

## 7. Technical Constraints

- All data stored in IndexedDB (Dexie.js v4); no server calls
- Notifications via Service Worker `showNotification()`; require app opened same day
- Export generated fully client-side (jsPDF + SheetJS)
- Supports: Chrome 100+, Firefox 100+, Safari 15.4+, Edge 100+
- Dosage stored as combined string (`"90 mg"`) entered via structured split-field UI (amount + unit dropdown)

---

## 8. What Was Shipped vs Original Plan

| Area | Original Plan | Shipped in v1.0.0 |
|------|---------------|-------------------|
| Today layout | Row per medicine + chips per slot | **Slot-grouped** with MedicineSlotCard (time-window mental model) |
| Dosage input | Free-text string | **Structured: amount (number) + unit dropdown** |
| Export max range | 90 days | **31 days** with quick-select presets |
| Export PDF headers | Always MM-DD | **Adaptive**: MM-DD ≤14 days, day-number-only >14 days |
| Missed dose banner CTA | Navigate to that day | **Inline Taken/Skip actions** in banner sheet |
| Evening reminder default | 19:00 | **18:00** |
| Test notification | `new Notification()` | **ServiceWorkerRegistration.showNotification()** |
| DoseRow component | Listed in plan | **Deleted** — superseded by slot-grouped MedicineSlotCard |

---

## 9. Acceptance Test Plan

See `TESTING.md` for full local testing instructions.

| # | Scenario | Expected Result | Status |
|---|----------|----------------|--------|
| T1 | Open app offline (airplane mode) | App loads, all features work | ✅ |
| T2 | Mark dose taken → kill app → reopen | Dose still marked taken | ✅ |
| T3 | Set reminder 1 min away → wait | Notification fires within 60s | ✅ |
| T4 | Tap notification | App opens to today's home screen | ✅ |
| T5 | Export 7-day PDF | Grid matches paper format; T/S/– correct | ✅ |
| T6 | Export 7-day Excel | Two sheets present; raw log filterable | ✅ |
| T7 | Archive medicine | Disappears from today; visible in historical export | ✅ |
| T8 | Install PWA to home screen | Opens standalone, no browser chrome | ✅ |
| T9 | Long-press dose | DoseActionModal opens with Taken/Skipped/Note | ✅ |
| T10 | Missed doses from yesterday | Banner shows count + medicine name preview | ✅ |
| T11 | Tap "Last month" preset on Export | Date pickers populate to full previous month | ✅ |
| T12 | Export 30-day PDF | Column headers show day numbers (1–30) | ✅ |

---

## 10. Test Suite (v1.0.0)

**60 tests across 10 files — all passing.**

See `TESTING.md` for instructions on running the test suite.

| File | Suite | Tests | Coverage |
|------|-------|-------|---------|
| `scheduling.test.ts` | `getDailySlots` | 6 | Slot generation, log attachment, multi-medicine |
| `scheduling.test.ts` | `getMissedDoses` | 4 | Past pending detection, today exclusion, taken/skipped exclusion |
| `MedicineRepository.test.ts` | `DexieMedicineRepository` | 8 | CRUD, soft-delete, inactive filter, put semantics |
| `DoseLogRepository.test.ts` | `DexieDoseLogRepository` | 5 | getByDate, getByRange, upsert insert, upsert update, deleteByMedicine |
| `SettingsRepository.test.ts` | `DexieSettingsRepository` | 5 | Default creation, idempotent get, field updates |
| `export.test.ts` | `buildGridData` | 7 | Row per medicine, date cells, T/S/– symbols, taken overrides skipped, single-day range |
| `notifications.test.ts` | `computeDelayMs` | 4 | Future time → ms, past time → null, 30-min ahead, same minute |
| `types.test.ts` | Zod schemas | 5 | Medicine validation, DoseLog validation, DEFAULT_SETTINGS |
| `MedicineForm.test.tsx` | `MedicineForm` | 7 | Render, name validation, slot validation, submit, cancel, prefill (edit), close |
| `MissedDoseBanner.test.tsx` | `MissedDoseBanner` | 5 | Empty renders nothing, count display, sheet open, Taken action, dismiss |
| `smoke.test.tsx` | Scaffold | 4 | All 4 pages render without crashing |
| **Total** | | **60** | |
