# What Changed — LICW MorseBrowser Fork

This document summarises every significant improvement and change made in this fork
relative to the upstream [LongIslandCW/morsebrowser](https://github.com/LongIslandCW/morsebrowser)
repository. Changes are grouped by topic.

---

## 1. React UI — Full Knockout.js Replacement

The entire user interface was rewritten from [Knockout.js](https://knockoutjs.com/) to
**React**. The Knockout library and all `ko.observable` / `data-bind` patterns have been
removed from every component.

- `src/App.tsx` is the new React entry point
- All UI lives under `src/morse/components/` as React function components
- A custom observable system (`src/morse/utils/observable.ts`) provides a KO-like API
  for the non-React `MorseViewModel` layer so the core logic was not rewritten
- `MorseContext` (`src/morse/context/MorseContext.tsx`) bridges the ViewModel observables
  into React state, batching updates with `requestAnimationFrame` to avoid over-rendering
- The HTML shell (`src/template.html`) now only mounts `#react-root`

---

## 2. Dark Mode

Full dark/light theme toggle using **Bootstrap 5.3 native colour modes**.

- `data-bs-theme` on `<html>` drives all Bootstrap component theming
- A small inline script in `<head>` reads `localStorage` and applies the saved theme
  **before CSS loads**, eliminating the flash-of-wrong-theme on page load
- Toggle button in the React header updates `data-bs-theme`, the `theme-color` meta tag,
  and persists the choice
- Extra CSS rules in `style.css` handle image inversion and component-level dark overrides

---

## 3. Settings Persistence — localStorage Migration

All settings that were previously saved as browser cookies (`js-cookie`) have been
migrated to **`localStorage`**.

- Cookies were unreliable in browsers with ITP/ETP; localStorage is always available
- A one-time migration on first load reads old cookie values into localStorage so
  existing user preferences are not lost
- `MorseCookies.loadCookiesOrDefaults()` now reads localStorage first, falling back
  to legacy cookies only when a key has not yet migrated

---

## 4. Lesson State Persistence

The selected lesson (TYPE → CLASS → LETTER GROUP → LESSON) and preset are now **saved
and restored across page reloads**.

- Four new localStorage keys: `lesson_userTarget`, `lesson_selectedClass`,
  `lesson_letterGroup`, `lesson_selectedLesson`
- `MorseLessonPlugin.restoreLessonState()` replays the saved selections during
  construction, before any reactive subscriptions are wired up — this is critical to
  prevent the cascading computed observables from resetting the restored values
- `restoringState` flag suppresses async preset fetches during restore so the user's
  saved WPM/FWPM/etc. are not overwritten by preset defaults

---

## 5. Bug Fixes

### Lesson Dropdown Permanently Blank After Class Change
Switching away from a class (e.g. BC1 → BC2) would permanently blank the LESSON
dropdown until the page was refreshed.

- Root cause 1: `displaysInitialized` was reset inside a computed observable that could
  fire without the `childrenComplete` callback that would re-arm it
- Root cause 2: an empty `<select>` left `selectedDisplay` as `undefined`, crashing
  downstream code that accessed `.fileName`
- Fixed: dummy "Select a lesson" item returned instead of `[]`; null guards added;
  auto-select logic added when exactly one lesson matches

### Speed Sync Lock Stomping Preset WPM/FWPM Values
When a preset specified 12 WPM / 8 FWPM and the user clicked the sync lock, it reset
to 12/12 instead of honouring the preset.

- Root cause: the `fwpm` writableComputed had a side-effect mutation (`trueFwpm(trueWpm())`)
  inside its read function — the same anti-pattern as an earlier fix to `overrideMax`
- Fixed: read function is now pure; a `syncWpm.subscribe` snaps `trueFwpm` to `trueWpm`
  only when sync is re-enabled

### WPM/FWPM Editable While a Preset is Active
The Char Speed and Effective Speed inputs accepted user edits even when a named preset
(not "Your Settings") was selected.

- Fixed: both inputs and the sync lock label are disabled / non-interactive whenever
  `selectedSettingsPreset.isDummy` is false
- Keyboard shortcuts (`z`/`x` for ±1 FWPM) also guarded at the `changeFarnsworth`
  entry point so they cannot bypass the UI lock

### Override Size Sync (Min/Max Lock)
The Min word-size input wrote directly to `trueOverrideMin` instead of through the
`overrideMin` writableComputed, bypassing the logic that keeps Max in sync when the
lock is enabled.

- Fixed: input routes through `overrideMin`; cookie loading uses `parseInt()` instead
  of an unsafe string-cast; `overrideMax` read function made pure with a
  `syncSize.subscribe` to snap on re-lock

### Invalid Override Sizes Causing Infinite Loop
If NaN values reached `randomWordList()` (e.g. from corrupted localStorage), the
word-generation loop could spin forever.

- Fixed: early return with `setText('')` when sizes/times are non-finite or out of range
- `overrideMin.write` and `overrideMax.write` now validate with `Number.isFinite`
  before updating backing observables

### Sticky Sets Cookie Restored as Wrong Type
`stickySets` (a string observable holding character groups like "ETAT") was passed
through `booleanize()` during cookie restore, turning literal "true"/"false" values
into booleans.

- Fixed: `target.val` is assigned directly, preserving the string type

### Shortcut Key Null Guard on Flag
The `f` shortcut to flag a card would crash if `currentIndex()` was out of bounds.

- Fixed: null guard on `word` before calling `addFlaggedWord`

### Noise Accordion Images / Mobile Layout
Several rendering issues in the noise section after the React migration.

- Broken images caused by lingering `ko with:` wrappers — removed
- Mobile layout misalignment in the noise volume icon — corrected

### Dark Mode Visual Glitches
- Save/Load buttons invisible in dark mode — fixed
- `form-check-label` text invisible after Bootstrap 5.3 upgrade — fixed

### GitHub Pages Deploy
`.nojekyll` file missing, causing Jekyll to interfere with the GitHub Pages static
deploy — added.

---

## 6. UI Reorganisation

- **Trail Reveal** moved from More Settings into the Lessons accordion, next to
  Randomize and Keep Lines — closer to its point of use
- **Auto Close Accordion** moved from Lessons into More Settings — it is a preference,
  not a per-session lesson selection
- **Download Audio** moved into the Playback group within More Settings
- More Settings accordion reorganised into labelled groups for clarity

---

## 7. New Content — Wordlists and Presets

The lesson library has been significantly expanded from the upstream baseline.

| | Count |
|---|---|
| Total wordlist entries | **845** |
| Student entries | 664 |
| Instructor entries | 181 |
| Wordfiles | 397 |
| Preset config files | 212 |

New curriculum paths added:

| TYPE | CLASS | Notes |
|------|-------|-------|
| STUDENT | ADV 1–3 | Advanced tracks |
| STUDENT | INT 1–3 | Intermediate tracks |
| STUDENT | OVERLEARN | Overlearning / spaced repetition sets |
| STUDENT | TTR+ | Traffic, abbreviations, prosigns |
| STUDENT | BC3 | Additional Beginner CW sets |
| INSTRUCTOR | BC1–BC2 | Instructor-facing lesson packs (IB series) |

New POL (plain-ordinary-language) preset series with multiple flow-rate options.

---

## 8. Test Suite — Vitest

A full automated test suite was added using [Vitest](https://vitest.dev/).

- **151 tests** across 15 test files (~300ms total runtime)
- Tests live next to the code they cover (`*.test.ts`)
- Coverage areas: Morse encode/decode, timing math, word parsing, string utilities,
  observable system, speed settings, frequency settings, lesson plugin, preset finder,
  flagged words, general utilities, wordlists integrity
- `npm test`, `npm run test:watch`, `npm run test:coverage` commands

---

## 9. CI/CD Modernisation

Replaced 6 legacy GitHub Actions workflows (Node.js 12, EOL 2022) with 2 clean
workflows using Node.js 20.

### `ci.yml` — runs on every push and pull request
1. Install dependencies
2. ESLint
3. TypeScript typecheck (`tsc --noEmit`)
4. Production build
5. Vitest test suite

### `deploy.yml` — runs on merge to `main`
1. Build
2. Deploy to GitHub Pages (backup)
3. Deploy to DigitalOcean droplet via rsync (main site)

---

## 10. TypeScript Strict Mode

Enabled `noImplicitAny` and `strictNullChecks` across the entire codebase.

- All implicit `any` types resolved
- All potential `null`/`undefined` dereferences guarded
- `typecheck` script added to `package.json` and wired into CI

---

## 11. Webpack Production Build

- Switched Webpack to `mode: 'production'` for minification and tree-shaking
- Added **PurgeCSS** to strip unused CSS rules from the production bundle
- Significant bundle size reduction vs the original development-mode build

---

## 12. Dependency and Tooling Updates

- Bootstrap upgraded to **5.3** (with native dark mode support)
- All major npm dependencies updated to current versions
- ESLint updated with `@typescript-eslint` rules; all violations fixed
- `prebuildLessons` / `prebuildPresets` / `prebuildPresetSets` scripts run at build
  time to generate the dynamic import switch-tables for lesson and preset files

---

## 13. Google Analytics Removed

Google Analytics and Google Tag Manager scripts were removed from `src/template.html`.
No user tracking.

---

## 14. Logo Responsive Sizing

The club logo scales responsively: 120 px on mobile, 200 px on screens ≥ 576 px.

---

## 15. Accessibility and Meta Tags

- Proper `aria-label`, `aria-checked`, `role` attributes on interactive controls
- `theme-color` meta tag updated on dark/light toggle
- Loading state handled so the React tree does not flash unstyled content

---

## 16. Documentation

Added developer and maintainer documentation not present in the upstream repo:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Developer guide, change log, architecture notes for AI-assisted work |
| `DOCUMENTATION.md` | Full technical reference for the app architecture |
| `AGENTS.md` | Instructions for AI coding agents (Cursor Cloud, Codex, Claude Code) |
| `docs/CODEBASE_GUIDE.md` | Plain-English guide for JS learners new to the codebase |
| `docs/MAINTAINER_GUIDE.md` | Guide for LICW admins maintaining this fork |
| `docs/TEST_BACKLOG.md` | Prioritised backlog of untested areas (P0–P5) |
| `CHANGES.md` | This file |
