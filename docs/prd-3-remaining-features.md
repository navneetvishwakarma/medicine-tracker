# PRD 3 — Remaining Features (Phase 3)

**Product:** Medicine Tracker  
**Version:** 1.0  
**Date:** 2026-05-18  
**Status:** Draft — backlog, prioritized by user feedback after Phase 2  
**Owner:** Product / Engineering

---

## 1. Context

Phases 1 and 2 deliver the core tracking loop and cloud infrastructure. Phase 3 adds features that increase the product's value for long-term users: adherence analytics, refill management, a doctor-shareable portal, and caregiver safety features.

None of these are blockers for Phase 1/2. All build on the existing architecture without breaking changes.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Surface adherence trends | Caretaker can see weekly/monthly adherence without exporting |
| Reduce stockout risk | Refill reminders triggered before medicines run out |
| Enable doctor sharing | Doctor can view log via shareable link (no account needed) |
| Support complex schedules | PRN (as-needed), tapered, and alternate-day schedules supported |

---

## 3. Feature Areas & User Stories

### 3.1 Adherence Analytics Dashboard

**US-1.1**
> As a caretaker, I want to see a weekly adherence percentage per medicine, so I can identify which drugs are most often missed.

**Acceptance Criteria:**
- Analytics page: default view = last 30 days
- Per-medicine bar: % taken (green) / skipped (yellow) / missed (red)
- Overall adherence score shown prominently
- Filterable by date range (7 / 30 / 90 days or custom)

---

**US-1.2**
> As a caretaker, I want to see which time slots have the most missed doses, so I can adjust reminders or routines.

**Acceptance Criteria:**
- Heatmap: rows = medicines, columns = days of week
- Color intensity = adherence rate (darker = more missed)
- Slot breakdown: Morning/Noon/Evening/Night miss rates

---

**US-1.3**
> As a caretaker, I want to share an adherence summary with my doctor via a link, so I don't need to bring printed papers to appointments.

**Acceptance Criteria:**
- "Share with Doctor" generates a time-limited read-only link (expires in 7 days)
- Link opens a clean, printable view (no login required)
- View shows: patient name, date range, per-medicine adherence grid
- Links managed in Settings (list of active links, revoke option)

**Technical:** Supabase: public row with short-lived signed URL. No PII in URL itself.

---

### 3.2 Refill Management

**US-2.1**
> As a caretaker, I want to log the current pill count for each medicine, so the app can estimate when I'll run out.

**Acceptance Criteria:**
- Medicine form: optional "Current stock (pills)" field
- App calculates: `days_remaining = stock / doses_per_day`
- Stock auto-decrements when doses marked as taken

---

**US-2.2**
> As a caretaker, I want a refill reminder N days before a medicine runs out, so I have time to get the prescription filled.

**Acceptance Criteria:**
- Settings: "Refill reminder lead time" (default 7 days)
- Push notification when `days_remaining ≤ lead_time`
- Notification: "BRILINTA 90 runs out in 5 days — refill now"
- Tap → opens medicine detail with refill action

---

**US-2.3**
> As a caretaker, I want to log a refill event with the new pill count, so the stock estimate resets correctly.

**Acceptance Criteria:**
- "Log Refill" action on medicine detail page
- Input: number of pills received
- Stock updated; refill event logged with timestamp
- Refill history visible in medicine detail

---

### 3.3 Complex Schedule Support

**US-3.1**
> As a caretaker, I want to add PRN (as-needed) medicines, so I can log them when administered without a fixed schedule.

**Acceptance Criteria:**
- New schedule type: "As needed (PRN)" — no fixed time slot
- PRN medicines appear in a separate section on the home screen
- Tap to log administration: timestamp + optional dose amount
- PRN doses appear in exports and analytics

---

**US-3.2**
> As a caretaker, I want to set alternate-day or weekly schedules, so medicines that aren't taken every day are tracked correctly.

**Acceptance Criteria:**
- Schedule builder: daily / alternate days / specific days of week / every N days
- Home screen shows only medicines scheduled for today
- Missed logic respects schedule frequency (no false "missed" on off days)

---

**US-3.3**
> As a caretaker, I want to set a tapering schedule (e.g., decreasing steroid dose), so the app automatically changes the dose over time.

**Acceptance Criteria:**
- Taper schedule: list of (start date, dosage, duration) rows
- App auto-updates displayed dosage based on current date
- Taper schedule visible in medicine detail with current position highlighted

---

### 3.4 Caregiver Safety Features

**US-4.1**
> As a caretaker, I want the app to warn me if I try to mark a dose as taken that was already marked by another caretaker today, so we don't accidentally double-dose.

**Acceptance Criteria:**
- If a dose is already `status = taken` and a second caretaker taps it, show confirmation: "Already marked taken by [name] at [time]. Mark taken again?"
- Requires explicit confirmation to override
- Both markings logged in dose history (audit trail)

---

**US-4.2**
> As a caretaker, I want a PIN lock on the app, so a child or other person can't accidentally change dose records.

**Acceptance Criteria:**
- Optional 4-digit PIN set in Settings
- App locks after 5 minutes of inactivity
- PIN required to unlock; 5 wrong attempts → 30-second lockout
- Biometric unlock (Face ID / fingerprint) if available on device

---

**US-4.3**
> As a caretaker, I want to see a full audit log of who changed what and when, so I can trace any discrepancies.

**Acceptance Criteria:**
- Audit log page (Settings → Audit Log)
- Entries: timestamp, caretaker name, action (marked taken/skipped/edited), medicine name
- Filterable by date range and caretaker
- Exportable to CSV

---

### 3.5 Onboarding & Guided Setup

**US-5.1**
> As a new caretaker, I want a guided setup flow when I first open the app, so I can add my patient and medicines without needing instructions.

**Acceptance Criteria:**
- First-launch wizard: Step 1 = patient name, Step 2 = add first medicine, Step 3 = set reminders, Step 4 = enable notifications
- Skippable at any step
- "Setup reminder" badge on Settings tab until setup is complete

---

**US-5.2**
> As a caretaker, I want contextual tooltips on my first use of key features, so I understand what each action does.

**Acceptance Criteria:**
- First time on Today screen: tooltip on a DoseChip explaining tap vs long-press
- First time on Export page: tooltip explaining PDF vs Excel
- Tooltips dismissed per-user; never shown again after dismissal

---

## 4. Technical Notes

All Phase 3 features build on Phase 2 infrastructure (Supabase, Expo, `packages/core`). No breaking schema changes expected. Additive migrations only.

| Feature | New Tables / Fields |
|---------|-------------------|
| Refill management | `medicine.stock`, `refill_events` table |
| Complex schedules | `medicine.schedule_type`, `schedule_rules` JSON column |
| Taper schedules | `taper_rules` table (medicine_id, start_date, dosage, days) |
| Audit log | `audit_log` table (user_id, action, entity, delta, created_at) |
| Doctor sharing | `share_links` table (id, user_id, expires_at, scope) |
| PIN lock | `settings.pin_hash` (bcrypt); no server involvement |

---

## 5. Prioritization (Suggested Order)

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P1 | Adherence analytics dashboard | M | High |
| P1 | Refill reminders | S | High |
| P2 | Doctor share link | M | High |
| P2 | PRN (as-needed) schedules | M | Medium |
| P2 | Double-dose warning | S | High (safety) |
| P3 | Alternate-day schedules | M | Medium |
| P3 | Taper schedules | L | Low |
| P3 | PIN lock + biometrics | M | Medium |
| P3 | Audit log | S | Medium |
| P4 | Onboarding wizard | M | Medium |
| P4 | Contextual tooltips | S | Low |

---

## 6. Acceptance Test Plan (Key Scenarios)

| # | Scenario | Expected Result |
|---|----------|----------------|
| T1 | 30-day adherence with 3 skips | Dashboard shows correct % per medicine |
| T2 | Generate doctor share link | Link opens read-only view in incognito; expires after 7 days |
| T3 | Stock = 8 pills, doses/day = 2, lead time = 5 days | Refill notification fires today |
| T4 | Log refill of 30 pills | Stock resets; next refill alert recalculated |
| T5 | Two caretakers mark same dose simultaneously | Warning shown; audit log records both events |
| T6 | Set 4-digit PIN; wait 6 min | App locks; PIN required to unlock |
| T7 | PRN medicine: tap "Log dose" | Dose logged with timestamp; visible in analytics |
| T8 | Alternate-day medicine on off day | Medicine absent from home screen; no "missed" logged |
