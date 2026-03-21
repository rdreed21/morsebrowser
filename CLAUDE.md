# CLAUDE.md — Fork Change Log

This repo is a fork of [LongIslandCW/morsebrowser](https://github.com/LongIslandCW/morsebrowser). The following changes have been made in this fork relative to the upstream main branch.

---

## Changes vs Upstream

### Bug Fix: LESSON dropdown blank / lesson list disappears on class switch
**File:** `src/morse/lessons/morseLessonPlugin.ts`

Several related bugs in the KnockoutJS lesson selection cascade:

- **`displays` computed no longer resets `displaysInitialized = false`** — Previously, the computed reset this flag on every recompute. Because KnockoutJS `childrenComplete` only fires when DOM nodes are added (not when same-length arrays are reused), the flag would get stuck as `false`, permanently blocking `setDisplaySelected` after any class switch. Now the flag is only `false` during initial page load (set in constructor) and stays `true` once initialized.

- **`displays` always returns dummy instead of empty array** — If no wordlist entries match the current class/userTarget/letterGroup combination, `displays` previously returned `[]`. An empty `<select>` causes KnockoutJS to set the `value` observable to `undefined`, crashing `applyOverrides`. Now returns the dummy item instead.

- **Auto-select lesson when only one option exists** — Added to `setDisplaysInitialized` (via `childrenComplete`) and `setLetterGroup`: when exactly one non-dummy lesson is available, it is auto-selected. This fixes the case where BC3+CHARACTERS has only one lesson (B1B2 REVIEW) and the dropdown appeared blank.

- **Null guards for `selectedDisplay()`** — `applyOverrides` and `setPresetSelected` both accessed `this.selectedDisplay().fileName` / `.display` without checking for `undefined`. Added null guards to prevent crashes when `selectedDisplay` is transiently `undefined` during KO binding reconciliation.

---

### Bug Fix: TYPE select did not call `changeUserTarget`
**File:** `src/template.html`

The TYPE `<select>` had a `value: lessons.userTarget` KO binding but no `event` handler, so changing the TYPE dropdown never called `changeUserTarget()` (which calls `setPresetSelected`). Added:
```html
event: {change: function() { lessons.changeUserTarget(lessons.userTarget()) }}
```

---

### UI Refactor: Settings, text area, and playback controls
**File:** `src/template.html`

Redesigned three sections for a cleaner, more compact layout:

- **Settings area** (WPM / FWPM / Volume): Changed from Bootstrap `input-group` rows to a `d-flex flex-wrap` layout with individual labeled fields.
- **Working text area**: Separated the eye/show-raw toggle into a toolbar row above the textarea. Play time and character count moved inline with the toolbar. Clear and Insert File buttons moved to the right side of the toolbar.
- **Playback controls**: Reorganized from a flat `btn-group` into three semantic `btn-group` clusters: Transport (Play/Pause/Stop), Navigation (Full RW / Back 1 / Fwd 1), and View (Reveal / Shuffle / Loop). Voice Recap button moved out of an `input-group` wrapper.

---

### Feature: Dark mode
**Files:** `src/css/style.css`, `src/template.html`

Added a full dark mode with persistence:

- **No-flash theme load** — An inline `<script>` in `<head>` runs synchronously before any CSS renders, applying `data-theme="dark"` on `<html>` if the user's preference is saved in `localStorage`.
- **Toggle button** — A 🌙/☀️ button next to the page title toggles dark mode and saves the preference to `localStorage`.
- **CSS overrides** — All dark mode styles are in `src/css/style.css` under the `[data-theme="dark"]` selector, covering: body background/text, form controls, select options, input groups, all Bootstrap button variants used in the app, accordion, text utilities, tables, badges, modals, and links.
- **CSS variable** — The hardcoded `#e7f1ff` keyboard shortcuts table header color was replaced with `var(--theme-table-header-bg)` so it correctly darkens in dark mode.

---

### Logo responsive sizing
**File:** `src/css/style.css`

Added CSS rules to constrain the logo image to 120px on mobile and 200px on screens ≥576px, preventing oversized logo on small screens.

---

### Removed Google Analytics / Google Tag Manager
**File:** `src/template.html`

Removed the `gtag.js` script, `dataLayer` initialization, and Google Tag Manager `<script>`/`<noscript>` blocks (tracking IDs: `G-STMHYHNZTJ`, `GTM-PB8HW3M`).

---

## Build & Deploy

```bash
# Build
npm run build

# Deploy to DigitalOcean
rsync -avz -e "ssh -i ~/.ssh/do_morsebrowser" dist/ root@45.55.102.82:/var/www/morsebrowser/
```

The build runs prebuild scripts (`prebuildLessons.js`, `prebuildPresetSets.js`, `prebuildPresets.js`) that auto-generate switch-based file finder modules before webpack runs.
