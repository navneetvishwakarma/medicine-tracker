# Medicine Tracker — Design System

**System Name:** Warm Precision  
**Version:** 1.0  
**Date:** 2026-05-18  
**Status:** Approved  
**Scope:** Phase 1 (React 19 + Tailwind v4 PWA); Phase 2 token mapping for React Native / Expo

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing](#4-spacing)
5. [Border Radius](#5-border-radius)
6. [Elevation and Shadow](#6-elevation-and-shadow)
7. [Motion](#7-motion)
8. [Component Inventory](#8-component-inventory)
9. [User Flows](#9-user-flows)
10. [Phase 2 — React Native Token Mapping](#10-phase-2--react-native-token-mapping)

---

## 1. Design Principles

The design system is called **Warm Precision**. The name encodes the central tension of a medicine tracker: clinical reliability (precision) delivered with the warmth of a trusted companion, not the coldness of a medical form.

### 1.1 Calm Clarity

Health context requires zero ambiguity. Every piece of information must be readable in a quick glance — by someone who may be tired, stressed, or elderly. Avoid decorative complexity. Labels accompany every icon. Status is always communicated in at least two ways (color + text/icon). Error messages say what happened and what to do next, not just "something went wrong."

### 1.2 Thumb-First

The primary action — marking a dose — must be reachable by a thumb without shifting grip. Primary interactive elements live in the bottom half of the screen. The minimum touch target size is **44 × 44 px** for any tappable element, matching Apple HIG and Google Material guidelines. Bottom sheets replace modals. Navigation lives at the bottom, not the top.

### 1.3 Status at a Glance

Color communicates dose state quickly, but color alone is never sufficient — text labels or icons always accompany color so the UI is accessible to users with color vision deficiency. Status pills always show both an icon and a text label. Section headers summarize the aggregate state ("✓ All done", "3 pending"). The missed-dose banner uses amber plus a bell icon, not red, to signal "needs attention" rather than "error."

### 1.4 Breathing Room

Generous spacing makes the app feel unhurried and trustworthy. A medicine tracker is used multiple times per day, often first thing in the morning and last thing at night. The layout should never feel cramped or rushed. Cards have comfortable internal padding. Sections have clear separation. Typography has open line heights. White space is a design element, not waste.

### 1.5 Progressive Disclosure

The core action — mark a dose as taken — is one tap on the status pill. Secondary actions — skip, add a note, undo — require one extra step (a bottom sheet). Destructive or irreversible actions (archive, delete) require confirmation. Editing a medicine schedule is behind a dedicated Medicines tab, not exposed on the daily view. The app reveals more only when the user reaches for it.

---

## 2. Color System

All colors are defined as CSS custom properties in the global stylesheet and consumed via Tailwind v4 utility classes. The palette uses warm-tinted neutrals for backgrounds and borders to avoid the clinical coldness of pure gray, while keeping semantic status colors vivid and accessible.

### 2.1 Semantic Token Table

#### Backgrounds and Surfaces

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-bg` | `#F7F6F3` | `bg-[--color-bg]` | App background — warm off-white, not pure white |
| `--color-surface` | `#FFFFFF` | `bg-white` | Card and sheet surfaces |

#### Text

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-text-primary` | `#1C1C1E` | `text-[--color-text-primary]` | Headings, medicine names, body copy |
| `--color-text-secondary` | `#6B6B6B` | `text-[--color-text-secondary]` | Dosage info, subtitles, helper text |
| `--color-text-tertiary` | `#AEAEB2` | `text-[--color-text-tertiary]` | Placeholder text, disabled states, timestamps |

#### Borders

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-border` | `#E8E7E2` | `border-[--color-border]` | Default card and input borders — warm tint |
| `--color-border-strong` | `#CFCEC8` | `border-[--color-border-strong]` | Dividers, focused input borders |

#### Brand

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-brand` | `#2563EB` | `bg-blue-600` / `text-blue-600` | Primary actions, active nav tab, "Now" badge |
| `--color-brand-surface` | `#EFF6FF` | `bg-blue-50` | Brand-tinted surface for "Now" badge background |

#### Status: Taken

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-taken-bg` | `#16A34A` | `bg-green-600` | Solid taken indicator |
| `--color-taken-surface` | `#F0FDF4` | `bg-green-50` | Taken pill background |
| `--color-taken-border` | `#86EFAC` | `border-green-300` | Taken pill border |
| `--color-taken-text` | `#15803D` | `text-green-700` | Taken pill label |

#### Status: Skipped

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-skipped-bg` | `#DC2626` | `bg-red-600` | Solid skipped indicator |
| `--color-skipped-surface` | `#FFF1F2` | `bg-red-50` | Skipped pill background |
| `--color-skipped-border` | `#FECACA` | `border-red-200` | Skipped pill border |
| `--color-skipped-text` | `#DC2626` | `text-red-600` | Skipped pill label |

#### Status: Pending

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-pending-bg` | `#9CA3AF` | `bg-gray-400` | Solid pending indicator |
| `--color-pending-surface` | `#F3F4F6` | `bg-gray-100` | Pending pill background |
| `--color-pending-text` | `#6B7280` | `text-gray-500` | Pending pill label |

#### Status: Warning (Missed)

| Token | Hex | Tailwind Usage | Purpose |
|-------|-----|----------------|---------|
| `--color-warning-bg` | `#D97706` | `bg-amber-600` | Warning icon and accent |
| `--color-warning-surface` | `#FFFBEB` | `bg-amber-50` | Missed dose banner background |
| `--color-warning-border` | `#FDE68A` | `border-amber-200` | Missed dose banner border |
| `--color-warning-text` | `#92400E` | `text-amber-800` | Missed dose banner body text |

### 2.2 Medicine Accent Colors

Each medicine is assigned one of eight accent colors. These colors appear as the 3px left border bar on medicine cards and as the background of the color-swatch picker in the add/edit form. They are purely decorative — they identify a medicine visually but carry no status meaning.

| Name | Hex | Tailwind Class | Use |
|------|-----|----------------|-----|
| Red | `#EF4444` | `bg-red-400` | Accent bar / swatch |
| Orange | `#F97316` | `bg-orange-400` | Accent bar / swatch |
| Yellow | `#EAB308` | `bg-yellow-400` | Accent bar / swatch |
| Green | `#22C55E` | `bg-green-400` | Accent bar / swatch |
| Teal | `#14B8A6` | `bg-teal-400` | Accent bar / swatch |
| Blue | `#3B82F6` | `bg-blue-400` | Accent bar / swatch |
| Purple | `#A855F7` | `bg-purple-400` | Accent bar / swatch |
| Pink | `#EC4899` | `bg-pink-400` | Accent bar / swatch |

> **Color pickers in the form:** Render as an 8-circle row, 32 × 32 px each, with a 2px white ring + 2px colored ring when selected. The selected swatch name is announced to screen readers via `aria-label`.

### 2.3 CSS Custom Property Setup (Tailwind v4)

```css
/* src/styles/tokens.css */
@layer base {
  :root {
    --color-bg: #F7F6F3;
    --color-surface: #FFFFFF;

    --color-text-primary: #1C1C1E;
    --color-text-secondary: #6B6B6B;
    --color-text-tertiary: #AEAEB2;

    --color-border: #E8E7E2;
    --color-border-strong: #CFCEC8;

    --color-brand: #2563EB;
    --color-brand-surface: #EFF6FF;

    --color-taken-bg: #16A34A;
    --color-taken-surface: #F0FDF4;
    --color-taken-border: #86EFAC;
    --color-taken-text: #15803D;

    --color-skipped-bg: #DC2626;
    --color-skipped-surface: #FFF1F2;
    --color-skipped-border: #FECACA;
    --color-skipped-text: #DC2626;

    --color-pending-surface: #F3F4F6;
    --color-pending-text: #6B7280;

    --color-warning-bg: #D97706;
    --color-warning-surface: #FFFBEB;
    --color-warning-border: #FDE68A;
    --color-warning-text: #92400E;
  }
}
```

---

## 3. Typography

### 3.1 Font Stack

The app uses the operating system's default sans-serif font. This eliminates web font loading latency and ensures text looks native on every device — critical for a health app where first-render speed matters.

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

In Tailwind v4 this is the default `font-sans` stack.

### 3.2 Type Scale

| Role | Size | Tailwind | Weight | Line Height | Usage |
|------|------|----------|--------|-------------|-------|
| Caption | 11px | `text-[11px]` | 400 / 500 | 1.4 | Section header labels, timestamp chips |
| Small | 13px | `text-sm` | 400 / 500 | 1.45 | Dosage info, subtitles, note text |
| Body | 15px | `text-[15px]` | 400 / 600 | 1.5 | Medicine names, list items, primary body |
| Large body | 17px | `text-[17px]` | 600 / 700 | 1.4 | Day label in DateNav, modal medicine name |
| Subheading | 20px | `text-xl` | 600 | 1.3 | Tab headings, empty-state headings |
| Heading | 24px | `text-2xl` | 700 | 1.25 | Page titles, export header |

### 3.3 Font Weights

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| Regular | 400 | `font-normal` | Body copy, secondary labels |
| Medium | 500 | `font-medium` | Navigation labels, chip labels |
| Semibold | 600 | `font-semibold` | Medicine names, action buttons, day label |
| Bold | 700 | `font-bold` | Page headings, strong emphasis |

### 3.4 Guidelines

- **Never use font sizes below 11px.** Even tertiary labels must be readable without zooming.
- **Never combine italic with small type.** Italics degrade legibility at 11–13px on low-DPI screens.
- **Line length:** Keep body text between 60–75 characters per line on tablet/desktop layouts. Mobile fills the column naturally.
- **All-caps:** Used only for section header labels (SlotSectionHeader). Add `tracking-widest` (`letter-spacing: 0.1em`) when using all-caps at 11px.

---

## 4. Spacing

The spacing system uses a **4px base unit**. All layout decisions — padding, margin, gap, inset — must be a multiple of 4px. This ensures visual consistency across components without needing a designer to review every layout decision.

### 4.1 Scale

| Token | px | Tailwind Class | Common Uses |
|-------|----|----------------|-------------|
| `space-1` | 4px | `p-1` / `gap-1` | Icon-to-text gap, badge internal padding |
| `space-2` | 8px | `p-2` / `gap-2` | Chip internal padding, status pill padding |
| `space-3` | 12px | `p-3` / `gap-3` | Card internal vertical rhythm |
| `space-4` | 16px | `p-4` / `gap-4` | Card padding (default), list item padding |
| `space-5` | 20px | `p-5` / `gap-5` | Section gap, modal padding horizontal |
| `space-6` | 24px | `p-6` / `gap-6` | Screen-edge horizontal padding on wide screens |
| `space-8` | 32px | `p-8` / `gap-8` | Section vertical margin, empty state gap |
| `space-10` | 40px | `p-10` / `gap-10` | Modal top padding |
| `space-12` | 48px | `p-12` / `gap-12` | Bottom nav height, bottom safe-area buffer |
| `space-16` | 64px | `p-16` / `gap-16` | Large empty-state illustration margin |

### 4.2 Screen-Edge Padding

| Context | Value | Rationale |
|---------|-------|-----------|
| Mobile list content | `px-4` (16px) | Standard mobile gutter |
| Mobile card content | `p-4` (16px) | Card-to-content breathing room |
| Bottom sheet content | `px-5 pt-5 pb-8` | Wider for comfortable thumb reach |
| Tab / nav bar | `px-4 py-2` | Navigation items stay visually tight |

---

## 5. Border Radius

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| `sm` | 8px | `rounded-lg` | Chips, time slot badges, small tags |
| `md` | 12px | `rounded-xl` | Cards (MedicineSlotCard, MedicineCard) |
| `lg` | 16px | `rounded-2xl` | Toast pills, action buttons in modals |
| `xl` | 24px | `rounded-3xl` | Bottom sheet top corners, color swatches |
| `full` | 9999px | `rounded-full` | Status pills, avatar circles, toggle pills |

> **Rule:** Use `rounded-full` for any pill-shaped element that renders text inside (status pills, "Now" badge). Use `rounded-xl` for rectangular cards. Never mix radius levels within a single card.

---

## 6. Elevation and Shadow

Elevation communicates layer hierarchy. The app has three elevation levels. Do not use box shadows for decorative purposes — shadow always signals "this element is above the baseline."

### 6.1 Shadow Levels

| Level | Name | CSS Value | Tailwind | Usage |
|-------|------|-----------|----------|-------|
| 1 | Card | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | `shadow-sm` | Medicine cards, slot cards |
| 2 | Modal | `0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)` | `shadow-md` | Bottom sheets, popovers |
| 3 | Overlay | `0 8px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)` | `shadow-lg` | Overlay backdrop-elevated panels |

### 6.2 Guidelines

- **Cards rest on the app background** (`#F7F6F3`) — the warm background provides natural separation; a shadow-sm is sufficient.
- **Bottom sheets** use shadow-md applied to the sheet panel itself. The backdrop is `rgba(0,0,0,0.4)`.
- **Toasts** float above all content — use shadow-lg.
- Never stack shadows (do not add a shadow to an element inside an element that already has a shadow).

---

## 7. Motion

Motion reinforces state changes and provides spatial context for navigation. All animation should feel **functional, not decorative**. If removing an animation would cause confusion about what just happened, keep it. If removing it would be unnoticeable, remove it.

### 7.1 Duration and Easing Tokens

| Name | Duration | Easing | Tailwind | Usage |
|------|----------|--------|----------|-------|
| Micro | 120ms | `ease` | `duration-[120ms]` | Color and opacity changes on hover/focus |
| Standard | 200ms | `ease` | `duration-200` | State pill transitions, icon swaps, badge appears |
| Deliberate | 300ms | `ease-out` | `duration-300 ease-out` | Bottom sheet enter, toast slide-in, page transition |

### 7.2 Default Interactive Transition

All interactive elements that change color or background apply `transition-colors` as a baseline:

```html
<button class="transition-colors duration-200 ...">Mark Taken</button>
```

### 7.3 Specific Animations

| Interaction | Animation | Notes |
|-------------|-----------|-------|
| Status pill: pending → taken | Background + border color crossfade | 200ms, ease |
| Bottom sheet open | Translate Y from 100% to 0, opacity 0→1 | 300ms, ease-out |
| Bottom sheet close | Translate Y from 0 to 100%, opacity 1→0 | 200ms, ease |
| Toast enter | Translate Y from +16px to 0, opacity 0→1 | 300ms, ease-out |
| Toast exit | Opacity 1→0 | 200ms, ease |
| "Now" badge pulse | Subtle scale 1→1.05→1 | 2s loop, only on the current slot |
| DateNav day change | Content fades out/in | 120ms crossfade |

### 7.4 Reduced Motion

Always respect `prefers-reduced-motion`. Wrap all animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Component Inventory

This section defines the visual contract for each component. Implementation details (state management, props interface) live in the architecture document. Each entry here covers: visual structure, key dimensions, and variant states.

---

### 8.1 MedicineSlotCard

The primary list item on the Today tab. Displays one medicine's status for the current day view.

**Structure:**

```
┌─ [3px color bar] ──────────────────────────────────────┐
│  Medicine Name (15px semibold, text-primary)            │
│  Dosage / timing (13px regular, text-secondary)         │
│                              [Status Pill →]            │
└─────────────────────────────────────────────────────────┘
```

**Specs:**

| Property | Value |
|----------|-------|
| Background | `bg-white` |
| Border radius | `rounded-xl` (12px) |
| Shadow | `shadow-sm` |
| Padding | `p-4` |
| Left accent bar | `w-[3px] self-stretch rounded-full` in medicine color |
| Minimum height | 64px (ensures 44px touch target with padding) |
| Medicine name | 15px, `font-semibold`, `text-[--color-text-primary]` |
| Subtitle | 13px, `font-normal`, `text-[--color-text-secondary]` |
| Status pill | Right-aligned, `ml-auto` |

**Interaction:** Tapping the card or the status pill triggers the dose action. Long-pressing opens the DoseActionModal bottom sheet.

---

### 8.2 Status Pill

An inline pill element that communicates the current dose state. Used on MedicineSlotCard and in the DoseActionModal confirmation.

**Variants:**

| State | Background | Text Color | Border | Icon | Label |
|-------|-----------|------------|--------|------|-------|
| Pending | `bg-gray-100` | `text-gray-500` | none | `○` Clock icon | "Pending" |
| Taken | `bg-green-50` | `text-green-700` | `border border-green-300` | `✓` Check icon | "Taken" |
| Skipped | `bg-red-50` | `text-red-600` | `border border-red-200` | `✕` X icon | "Skipped" |

**Specs:**

| Property | Value |
|----------|-------|
| Shape | `rounded-full` |
| Padding | `px-3 py-1` |
| Font size | 13px |
| Font weight | `font-medium` |
| Icon | 14px, same color as text, `mr-1` gap |
| Min touch target | 44px height via parent card padding; pill itself is ~28px tall |
| Transition | `transition-colors duration-200` on all state changes |

**Accessibility:** `aria-label="[Medicine name] — [state]"` on the pill. Never rely on color alone — the icon and label are always present.

---

### 8.3 DateNav

Sticky navigation bar at the top of the Today tab. Allows the user to move ± days from today.

**Structure:**

```
[← chevron]   Monday          [→ chevron]
              18 May 2026
```

**Specs:**

| Property | Value |
|----------|-------|
| Position | `sticky top-0 z-10` |
| Background | `bg-white` with `border-b border-[--color-border]` |
| Padding | `px-4 py-3` |
| Day label | 17px, `font-bold`, `text-[--color-text-primary]` |
| Date below | 12px, `font-normal`, `text-[--color-text-secondary]` |
| Chevron buttons | 44 × 44 px tap target, `text-[--color-text-secondary]` |
| Today indicator | Blue dot below the day label when viewing today |
| Past days | Day label in `text-[--color-text-secondary]` (not primary) |

---

### 8.4 SlotSectionHeader

Divides the medicine list into time-of-day sections: Morning, Noon, Evening, Night.

**Structure:**

```
MORNING  ·  08:00         [Now]          ✓ All done
```

**Specs:**

| Property | Value |
|----------|-------|
| Section label | 11px, `font-medium`, `uppercase`, `tracking-widest`, `text-gray-400` |
| Time | 11px, `text-gray-400` |
| Gap between label and time | `·` separator, `mx-2` |
| "Now" badge | `bg-blue-50 text-blue-600`, `rounded-full`, 11px, `font-semibold`, `px-2 py-0.5` |
| "✓ All done" | 11px, `text-green-600`, `font-medium`, shown when all slots in this section are taken or skipped |
| Padding | `px-4 pt-4 pb-2` |

The "Now" badge appears on the section whose scheduled time is closest to the current clock time and has at least one pending dose.

---

### 8.5 MedicineCard

Used on the Medicines management tab. Displays a medicine's full configuration with edit and archive actions.

**Structure:**

```
┌─ [3px color bar] ──────────────────────────────────────┐
│  Medicine Name (15px semibold)                          │
│  Dosage  ·  Meal timing  (13px gray)                   │
│  [08:00] [12:00] [20:00]  (time chips)                 │
│                            [Edit ✎]  [Archive ⋯]       │
└─────────────────────────────────────────────────────────┘
```

**Specs:**

| Property | Value |
|----------|-------|
| Background | `bg-white` |
| Border radius | `rounded-xl` |
| Shadow | `shadow-sm` |
| Padding | `p-4` |
| Left accent bar | Same as MedicineSlotCard |
| Medicine name | 15px, `font-semibold` |
| Dosage / timing | 13px, `text-[--color-text-secondary]` |
| Time chips | `bg-gray-100 text-gray-600 rounded-lg px-2 py-1 text-[13px]` |
| Edit button | `text-blue-600`, icon + label, 44px tap target |
| Archive button | `text-gray-400`, icon only with tooltip, 44px tap target |

---

### 8.6 DoseActionModal

A bottom sheet that appears when the user long-presses a status pill or taps "Review" on a missed dose banner. It allows marking a dose taken or skipped with an optional note.

**Structure:**

```
  ━━━━  (drag handle)
  
  Medicine Name          17px semibold
  Morning Slot           13px gray
  
  ┌─────────────────┐  ┌─────────────────┐
  │  ✓  Mark Taken  │  │  ✕  Mark Skipped│
  └─────────────────┘  └─────────────────┘
  
  Add a note (optional)
  ┌───────────────────────────────────────┐
  │                                       │
  └───────────────────────────────────────┘
```

**Specs:**

| Property | Value |
|----------|-------|
| Container | Fixed bottom, `w-full max-w-lg mx-auto` |
| Background | `bg-white` |
| Border radius | `rounded-t-3xl` (top corners only, 24px) |
| Shadow | `shadow-lg` |
| Drag handle | `w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-5` |
| Medicine name | 17px, `font-semibold`, `text-[--color-text-primary]` |
| Slot label | 13px, `text-[--color-text-secondary]`, below name, `mb-5` |
| Backdrop | `bg-black/40` fixed inset-0 |
| "Mark Taken" button | `bg-green-600 text-white`, `rounded-xl`, full width, 52px height |
| "Mark Skipped" button | `bg-white text-red-600 border border-red-200`, `rounded-xl`, full width, 52px height |
| Button gap | `gap-3` |
| Note textarea | `mt-4`, `bg-gray-50 border border-[--color-border] rounded-xl p-3`, 13px, 3 rows |
| Padding | `px-5 pb-8` (pb-8 ensures space above home indicator on iOS) |
| Enter animation | Slide up from bottom, 300ms ease-out |

---

### 8.7 MissedDoseBanner

An amber warning bar that appears below the DateNav when one or more doses from a past slot on today's date were not marked.

**Structure:**

```
⚠  Missed: Aspirin, Metformin (+1 more)        [Review →]
```

**Specs:**

| Property | Value |
|----------|-------|
| Background | `bg-amber-50` |
| Border | `border-b border-amber-200` |
| Padding | `px-4 py-3` |
| Icon | `⚠` amber-600, 16px, `mr-2` |
| Text | 13px, `text-[--color-warning-text]` (`#92400E`) |
| Medicine names | Up to 2 names shown inline; overflow shown as "(+N more)" |
| "Review" button | 13px, `font-semibold`, `text-amber-700`, right-aligned |
| Tap behavior | Opens a bottom sheet listing all missed doses with Taken / Skipped actions |

---

### 8.8 Toast

A floating pill at the bottom of the screen used for non-blocking feedback after actions.

**Types:**

| Type | Background | Text | Usage |
|------|-----------|------|-------|
| Success | `bg-green-600` | `text-white` | "Dose marked as taken" |
| Error | `bg-red-600` | `text-white` | "Failed to save — try again" |
| Info | `bg-gray-800` | `text-white` | "Reminder set for 08:00" |

**Specs:**

| Property | Value |
|----------|-------|
| Shape | `rounded-xl` |
| Padding | `px-5 py-3` |
| Font size | 15px |
| Font weight | `font-medium` |
| Shadow | `shadow-lg` |
| Position | Fixed, centered horizontally, `bottom-[80px]` (above nav bar) |
| Max width | `max-w-sm w-auto` |
| Auto-dismiss | 3 seconds; 5 seconds for error type |
| Icon | Leading icon (check / x / info) at 16px, `mr-2` |
| Enter | Slide up + opacity, 300ms ease-out |
| Exit | Opacity fade, 200ms ease |
| Stack behavior | Queue toasts; do not stack more than 1 at a time |

---

### 8.9 Navigation Bar

A fixed bottom tab bar with four tabs.

**Tabs (in order):**

| Tab | Icon | Label |
|-----|------|-------|
| Today | Calendar today | "Today" |
| Medicines | Pill / capsule | "Medicines" |
| Export | Download | "Export" |
| Settings | Gear | "Settings" |

**Specs:**

| Property | Value |
|----------|-------|
| Position | Fixed bottom, `w-full` |
| Height | 56px + safe-area inset (use `pb-safe` or CSS env()) |
| Background | `bg-white` |
| Border | `border-t border-[--color-border]` |
| Active tab icon | `text-blue-600` |
| Active tab label | `text-blue-600`, 11px, `font-medium` |
| Inactive tab icon | `text-gray-400` |
| Inactive tab label | `text-gray-400`, 11px, `font-normal` |
| Icon size | 24px |
| Tab min width | 44px touch target per tab |
| Tap transition | `transition-colors duration-120` |

---

## 9. User Flows

These flows describe the step-by-step user journey for each primary and secondary task. They are ordered by frequency of use in daily operation.

---

### 9.1 Daily Check-in (Primary Flow — ~30 seconds)

**Goal:** Mark today's morning medicines as taken.  
**Entry point:** App opened from home screen or notification tap.

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | Today tab loads, DateNav shows today's date | — (app opens to today automatically) |
| 2 | Current slot section (e.g., "MORNING") has "Now" badge; pending pills show in gray | User scans the list |
| 3 | User identifies a medicine to mark | Taps the gray "Pending" status pill |
| 4 | Pill transitions to green "Taken" state | — (single tap, no confirmation needed) |
| 5 | Toast appears: "Aspirin marked as taken" (auto-dismisses in 3s) | — |
| 6 | User taps the next pending pill | Repeat step 3–5 |
| 7 | All medicines in the section are marked | SlotSectionHeader updates to "✓ All done" |

**Outcome:** Session complete. App can be closed. No further action required.

---

### 9.2 Skip with Note (Secondary Flow)

**Goal:** Mark a medicine as skipped and optionally record why.  
**Entry point:** Medicine appears as pending in the Today list.

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | MedicineSlotCard shows pending pill | User long-presses the status pill (or taps → skip option if visible) |
| 2 | DoseActionModal bottom sheet slides up with drag handle visible | — |
| 3 | Sheet shows medicine name, slot label, "Mark Taken" and "Mark Skipped" buttons, optional note field | User taps "Mark Skipped" |
| 4 | Optionally: user taps note field, types reason | Text input opens; keyboard slides up |
| 5 | User taps "Mark Skipped" to confirm (or taps it on first press with note already typed) | — |
| 6 | Sheet dismisses; status pill transitions to red "Skipped" state | Toast: "Aspirin marked as skipped" |

**Outcome:** Dose recorded as skipped with optional note attached to the dose record.

---

### 9.3 Review Missed Doses

**Goal:** Catch up on doses that were not marked before a slot's window passed.  
**Entry point:** MissedDoseBanner appears at top of Today tab.

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | Amber banner below DateNav: "Missed: Aspirin, Metformin (+1 more)" | User taps "Review →" |
| 2 | Bottom sheet opens listing all missed doses as individual rows, each with "Taken" and "Skipped" action buttons | — |
| 3 | User taps "Taken" or "Skipped" for each medicine | Each row updates inline to show selected state |
| 4 | User dismisses sheet by dragging down or tapping backdrop | Sheet closes |
| 5 | Missed dose banner disappears if all missed doses are now resolved | — |

**Outcome:** Retroactive dose records created with the actual timestamp of marking (not the scheduled time). The PDF/Excel export marks these with an asterisk.

---

### 9.4 Add a Medicine

**Goal:** Register a new medicine with its schedule.  
**Entry point:** Medicines tab → "Add" button (top right, `text-blue-600`).

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | Medicines tab shows list of existing medicines | User taps "Add" |
| 2 | Add Medicine form opens (full-screen or bottom sheet on mobile) | — |
| 3 | User enters medicine name | Text field, `autofocus` |
| 4 | User enters dosage (e.g., "500mg") | Text field |
| 5 | User selects meal timing: "Before meal" / "After meal" / "With meal" / "Any time" | Segmented control or pill group |
| 6 | User selects time slots: Morning / Noon / Evening / Night (multiple allowed) | Toggle chips |
| 7 | User selects an accent color (8 swatches) | Color swatch row |
| 8 | User taps "Save" | Form validates; medicine saved to IndexedDB |
| 9 | Form closes; new medicine appears in Medicines list and on Today tab | Toast: "Metformin added" |

**Validation rules:** Name is required and must be unique (case-insensitive). At least one time slot must be selected.

---

### 9.5 Export Report

**Goal:** Generate a PDF or Excel report of dose history to share with a doctor.  
**Entry point:** Export tab.

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | Export tab shows date range pickers (start / end) and format selector | User selects start date |
| 2 | — | User selects end date (max 14 days from start; UI enforces this) |
| 3 | Preview area shows: "X doses across Y medicines" | — |
| 4 | User selects format: "PDF" or "Excel" | Toggle |
| 5 | User taps "Download" | Client-side generation begins |
| 6 | Spinner replaces button for 1–3 seconds | — |
| 7 | File downloads via browser (or native share sheet in Phase 2) | Toast: "Report ready" |

**Date range cap:** 14 days. This limits file size and generation time on low-end devices.

---

### 9.6 Enable Dose Reminders

**Goal:** Turn on browser push notifications for scheduled dose times.  
**Entry point:** Settings tab → "Dose reminders" toggle.

| Step | Screen State | User Action |
|------|-------------|-------------|
| 1 | Settings tab, "Dose reminders" row shows OFF toggle | User taps the toggle |
| 2 | If permission not yet requested: browser permission dialog appears ("Allow notifications?") | User taps "Allow" |
| 3 | If allowed: toggle flips to ON; settings save | — |
| 4 | If denied: toggle stays OFF; inline message explains how to re-enable in browser settings | — |
| 5 | Notification is scheduled per medicine slot via the service worker | Toast: "Reminders enabled" |

**Notification format:** `"Time to take Aspirin (500mg) · Morning"` — tapping opens the Today tab.

---

## 10. Phase 2 — React Native Token Mapping

Phase 2 adds a React Native (Expo) app sharing business logic through `packages/core`. The UI layer is rebuilt natively; the design tokens must be translated from CSS to React Native StyleSheet constants.

### 10.1 Token File Location

```
packages/core/tokens.ts        ← single source of truth for both platforms in Phase 2
src/styles/tokens.css          ← Phase 1 CSS (becomes a consumer of the TS constants)
```

### 10.2 CSS Custom Property → TypeScript Constant Mapping

```typescript
// packages/core/tokens.ts

export const colors = {
  bg: '#F7F6F3',
  surface: '#FFFFFF',

  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B6B',
  textTertiary: '#AEAEB2',

  border: '#E8E7E2',
  borderStrong: '#CFCEC8',

  brand: '#2563EB',
  brandSurface: '#EFF6FF',

  takenBg: '#16A34A',
  takenSurface: '#F0FDF4',
  takenBorder: '#86EFAC',
  takenText: '#15803D',

  skippedBg: '#DC2626',
  skippedSurface: '#FFF1F2',
  skippedBorder: '#FECACA',
  skippedText: '#DC2626',

  pendingSurface: '#F3F4F6',
  pendingText: '#6B7280',

  warningBg: '#D97706',
  warningSurface: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  medicineAccents: {
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#EAB308',
    green: '#22C55E',
    teal: '#14B8A6',
    blue: '#3B82F6',
    purple: '#A855F7',
    pink: '#EC4899',
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  caption: 11,
  small: 13,
  body: 15,
  largeBody: 17,
  subheading: 20,
  heading: 24,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;
```

### 10.3 Tailwind Class → StyleSheet.create() Mapping

| Tailwind (Phase 1) | React Native StyleSheet (Phase 2) |
|--------------------|----------------------------------|
| `bg-white` | `{ backgroundColor: colors.surface }` |
| `bg-[--color-bg]` | `{ backgroundColor: colors.bg }` |
| `text-[15px] font-semibold` | `{ fontSize: fontSize.body, fontWeight: fontWeight.semibold }` |
| `rounded-xl` | `{ borderRadius: radius.md }` |
| `rounded-full` | `{ borderRadius: radius.full }` |
| `p-4` | `{ padding: spacing[4] }` |
| `px-4 py-3` | `{ paddingHorizontal: spacing[4], paddingVertical: spacing[3] }` |
| `shadow-sm` | `{ shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }` |
| `gap-3` | `{ gap: spacing[3] }` (RN 0.71+) |

### 10.4 Component-Level Translations

| Phase 1 Pattern | Phase 2 Equivalent |
|----------------|--------------------|
| Bottom sheets (DoseActionModal, MissedDoseBanner review) | `@gorhom/bottom-sheet` |
| `onLongPress` (status pill) | `<Pressable onLongPress={...} delayLongPress={400}>` |
| CSS `transition-colors` | `Animated.timing` or `useAnimatedStyle` (Reanimated v3) |
| `sticky top-0` (DateNav) | `<SectionList` sticky section headers or `position: 'absolute'` |
| Browser Notification API | `expo-notifications` |
| IndexedDB / Dexie | `expo-sqlite` + repository implementation swap |
| `navigator.share` / file download | `expo-sharing` + `expo-file-system` |

### 10.5 Typography

System fonts map naturally without any font loading or licensing work:

| Platform | Font Family | Notes |
|----------|------------|-------|
| iOS | SF Pro | Default `-apple-system` maps here; used automatically |
| Android | Roboto | RN default; matches web `Roboto` fallback |
| Web | System stack | `font-sans` Tailwind default |

No custom font files are needed in either phase. If a custom font is introduced (e.g., for branding purposes), it must be loaded via `expo-font` in Phase 2 and `@font-face` in Phase 1, and the `tokens.ts` file must include a `fontFamily` constant.

### 10.6 Phase 2 Migration Checklist

When beginning Phase 2, the following design-system tasks apply:

- [ ] Create `packages/core/tokens.ts` with the constants above
- [ ] Update Phase 1 `tokens.css` to import hex values from a generated CSS file derived from `tokens.ts` (use a build script to keep a single source of truth)
- [ ] Audit all hardcoded hex values in the Phase 1 codebase; replace with token references
- [ ] Implement `MedicineSlotCard`, `StatusPill`, `DoseActionModal`, and `DateNav` as React Native components consuming `tokens.ts` directly
- [ ] Install `@gorhom/bottom-sheet` and map all bottom-sheet interactions
- [ ] Verify 44px minimum touch targets on physical iOS and Android devices (use Xcode Accessibility Inspector and Android Layout Inspector)
- [ ] Test all status colors with iOS Color Filters (Settings → Accessibility → Display & Text Size → Color Filters) and Android color correction modes
- [ ] Confirm `prefers-reduced-motion` equivalent: React Native respects `AccessibilityInfo.isReduceMotionEnabled()`

---

*This document is the single source of truth for visual design decisions in the Medicine Tracker product. All component implementations, designer mockups, and QA checklists should reference this document. Updates require a version bump and approval from both design and engineering leads.*
