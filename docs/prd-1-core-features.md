# PRD 1 — Core Features (Phase 1: Web PWA)

**Product:** Medicine Tracker  
**Version:** 1.0  
**Date:** 2026-05-18  
**Status:** Approved  
**Owner:** Product / Engineering

---

## 1. Problem Statement

A patient manages their own daily medications on paper — a grid of medicine names vs dates, hand-filled with T (taken) / S (skipped) / blank (missed). This process has no reminders, no history search, is prone to loss, and can't be shared digitally with a doctor.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Replace paper tracker digitally | 100% of daily doses loggable without paper |
| Works without internet | App fully functional in airplane mode |
| Reduce missed doses | Patient receives reminder notifications per scheduled slot |
| Enable doctor-ready export | Grid export matching paper format in ≤3 taps |

## 3. Non-Goals (Phase 1)

- Multi-user / multi-device sync
- Cloud backup
- Photo upload of medicines
- Prescription management / refill tracking
- Doctor portal

---

## 4. Users

| Persona | Phase | Description |
|---------|-------|-------------|
| **Patient** | Phase 1 (primary) | Manages their own medicines, marks doses taken/skipped, receives reminders |
| Caretaker | Phase 3 | Invited by patient; marks doses on patient's behalf; requires multi-user sync |

---

## 5. User Stories

### 5.1 Daily Dose Tracking

**US-1.1**
> As a patient, I want to see all of today's medicines organized by time slot (Morning / Noon / Evening / Night), so I know exactly what to give and when.

**Acceptance Criteria:**
- Home screen shows current date with ← / → day navigation
- Each medicine appears as a row; its scheduled slots appear as chips in that row
- Chips show: gray = pending, green ✓ = taken, red = skipped
- Only slots the medicine is scheduled for are shown (e.g., if a medicine is once daily at morning, only one chip appears)

---

**US-1.2**
> As a patient, I want to tap a dose chip to mark it as taken, so I can log a dose in one interaction.

**Acceptance Criteria:**
- Single tap on pending chip → taken (green ✓)
- Single tap on taken chip → undo back to pending
- Change persists to IndexedDB immediately with `markedAt` timestamp

---

**US-1.3**
> As a patient, I want to long-press a dose chip to mark it as skipped and optionally add a reason, so the doctor can see why a dose was missed.

**Acceptance Criteria:**
- Long-press (500ms) on any chip opens a bottom sheet
- Bottom sheet options: Taken / Skipped / Add note
- Skip reason field (optional free text, max 200 chars)
- Note visible on chip hover/tap in history view

---

**US-1.4**
> As a patient, I want to see a banner for missed doses from previous days, so I don't lose track of gaps.

**Acceptance Criteria:**
- On app load: if any dose from prior 7 days has `status = pending` and `scheduledDate < today`, show dismissible banner
- Banner lists medicine name + date + slot
- Tapping a banner item navigates to that day

---

### 5.2 Medicine Management

**US-2.1**
> As a patient, I want to add a new medicine with its name, dosage, schedule, and meal relation, so the app knows when to remind me and what to log.

**Acceptance Criteria:**
- Form fields: name (required), dosage (required), time slots (multi-select: Morning/Noon/Evening/Night), time per slot (HH:MM picker), meal relation (Before/After/With/None), color (8 presets), notes (optional)
- Validation via Zod: name max 100 chars, at least one slot required
- Saved to IndexedDB; appears in today's grid immediately

---

**US-2.2**
> As a patient, I want to edit a medicine's details, so I can update it if the prescription changes.

**Acceptance Criteria:**
- Edit opens same form pre-filled
- Changes take effect from current date (historical logs unaffected)
- Success toast on save

---

**US-2.3**
> As a patient, I want to archive (soft-delete) a medicine, so it no longer appears in daily tracking but remains in historical exports.

**Acceptance Criteria:**
- Archive option in medicine list (swipe or menu)
- Archived medicines: `active = false`; hidden from today's grid
- Historical dose logs for archived medicines still appear in exports

---

### 5.3 Settings

**US-3.1**
> As a patient, I want to set global reminder times for each slot, so all medicines in that slot fire at the same time.

**Acceptance Criteria:**
- Settings page: time picker per slot (Morning / Noon / Evening / Night)
- Defaults: 08:00 / 13:00 / 19:00 / 21:00
- Changing a time reschedules all pending notifications for that slot

---

**US-3.2**
> As a patient, I want to set my name, so exports show accurate attribution.

**Acceptance Criteria:**
- Field: Patient Name (required, max 100 chars)
- Name shown in export PDF/Excel header
- Default value "Patient" on first launch

> **Note:** Caretaker name and active-user toggle are Phase 3 features (multi-user sync required).

---

**US-3.3**
> As a patient, I want to enable/disable notifications and test them, so I can verify they work on my device before relying on them.

**Acceptance Criteria:**
- Toggle: Notifications On/Off
- On enable: `Notification.requestPermission()` prompt
- "Send test notification" button → fires immediately
- If permission denied: inline guidance to enable in browser settings

---

### 5.4 Notifications

**US-4.1**
> As a patient, I want to receive a browser notification at each medicine's scheduled time, so I'm reminded even if the app isn't open on screen.

**Acceptance Criteria:**
- Notification fires within ±60 seconds of scheduled time
- Title: "Medicine Reminder — [Slot]"
- Body: list of medicines due in that slot
- Tap → opens app to today's home screen

**Known Limitation:** Notifications require the app to have been opened at least once that day (no backend in Phase 1). Documented in Settings UI.

---

### 5.5 Export

**US-5.1**
> As a patient, I want to export a date range as a PDF grid, so I can hand it to the doctor at an appointment.

**Acceptance Criteria:**
- Export page: date range picker (default last 7 days, max 90 days)
- PDF: landscape A4, header = patient name + date range
- Grid: medicine rows × date columns; cells = T / S / – (Taken/Skipped/Pending)
- Download triggered client-side; no server required

---

**US-5.2**
> As a patient, I want to export raw dose logs to Excel, so I can filter and analyze adherence data myself.

**Acceptance Criteria:**
- Excel download: two sheets
  - Sheet 1 (Raw Log): all DoseLog fields, filterable
  - Sheet 2 (Summary Grid): same layout as paper tracker
- File named: `medicine-log-YYYYMMDD-YYYYMMDD.xlsx`

---

### 5.6 PWA / Offline

**US-6.1**
> As a patient, I want the app to work fully without internet, so I can use it in areas with no signal.

**Acceptance Criteria:**
- App loads from cache when offline
- All dose marking, medicine management, and settings work offline
- Offline status banner shown when network is unavailable
- No data loss when connectivity is restored

**US-6.2**
> As a patient, I want to install the app on my phone's home screen, so it opens like a native app.

**Acceptance Criteria:**
- Valid `manifest.webmanifest` with name, icons (192×192, 512×512), theme color
- "Add to Home Screen" prompt triggered by browser on eligible visits
- Installed app runs in `standalone` display mode (no browser chrome)

---

## 6. Out of Scope

- Cloud sync or multi-device support → PRD 2
- Native iOS / Android app → PRD 2
- Caretaker multi-user mode (`markedBy`, active-user toggle, double-dose warning) → PRD 3
- Biometric/PIN lock → PRD 3
- Refill reminders / stock tracking → PRD 3
- Analytics dashboard → PRD 3

---

## 7. Technical Constraints

- All data stored in IndexedDB (Dexie.js); no server calls
- Notifications via Service Worker `showNotification()`; require app opened same day
- Export generated fully client-side (jsPDF + SheetJS)
- Supports: Chrome 100+, Firefox 100+, Safari 15.4+, Edge 100+

---

## 8. Build Order

1. Types + Zod schemas
2. Dexie setup + Repository implementations
3. Domain functions (scheduling, adherence, export grid)
4. TanStack Query hooks
5. Service worker (offline cache + notification click)
6. Today page — dose grid + mark-as-taken flow
7. Medicines page — add/edit/archive
8. Notification scheduler
9. Settings page
10. Export page — PDF + Excel
11. PWA config: manifest, icons, vite-plugin-pwa
12. Polish: loading states, empty states, offline banner

---

## 9. Acceptance Test Plan

| # | Scenario | Expected Result |
|---|----------|----------------|
| T1 | Open app offline (airplane mode) | App loads, all features work |
| T2 | Mark dose taken → kill app → reopen | Dose still marked taken |
| T3 | Set reminder 1 min away → wait | Notification fires within 60s |
| T4 | Tap notification | App opens to today's home screen |
| T5 | Export 7-day PDF | Grid matches paper format; all statuses correct |
| T6 | Export 7-day Excel | Two sheets present; raw log filterable |
| T7 | Archive medicine | Disappears from today; visible in historical export |
| T8 | Install PWA to home screen | Opens standalone, no browser chrome |
