# CLAUDE.md — MorseBrowser Fork Change Log & Developer Guide

This file documents everything added or changed in this fork relative to the upstream
[LongIslandCW/morsebrowser](https://github.com/LongIslandCW/morsebrowser) repository.
It is also a practical guide for LICW admins maintaining this fork.

---

## Quick Reference

```bash
npm run dev            # Start local dev server at http://localhost:3000
npm run build          # Production build → dist/
npm test               # Run all 148 automated tests (takes ~300ms)
npm run test:watch     # Tests re-run live as you edit code
npm run test:coverage  # Tests + show what % of code is covered
```

---

## Current architecture (this fork)

The **UI is React** (`src/App.tsx`, `src/morse/components/**/*.tsx`). **`MorseViewModel`** (`src/morse/morse.ts`) still owns practice logic, lessons, audio, and settings. State uses **custom observables** in `src/morse/utils/observable.ts` (KO-like API; the Knockout library is not used). **`MorseContext`** (`src/morse/context/MorseContext.tsx`) subscribes to observables and mirrors values into React so components re-render. The HTML shell `src/template.html` only mounts `#react-root` and applies saved theme before CSS loads.

---

## Changes vs Upstream

### 8. Settings & Lesson State Persistence (localStorage migration) — IN PROGRESS
**Files:** `src/morse/cookies/morseCookies.ts`, `src/morse/morse.ts`, `src/morse/lessons/morseLessonPlugin.ts`, `src/morse/components/app/LessonsAccordion.tsx`, `src/morse/context/MorseContext.tsx`

**What was done:**
- Migrated all settings persistence from `js-cookie` to `localStorage` (cookies were unreliable in browsers with ITP/ETP). One-time migration reads old cookie values into localStorage on first load.
- Added 4 new lesson subscriptions in `morse.ts`: `lesson_userTarget`, `lesson_selectedClass`, `lesson_letterGroup`, `lesson_selectedLesson`.
- Added `restoreLessonState()` to `MorseLessonPlugin`. Called from `MorseViewModel` constructor after `initializeWordList()`, **before** `saveToStorage` subscriptions are wired up. This is critical: the `classes` / `letterGroups` computed observables have side effects (`selectedClass('')`, `letterGroup('')`) that would overwrite saved localStorage values if subscriptions were active.
- `LessonsAccordion.tsx` `useEffect` simplified — no longer runs the init cascade; only wires reactive subscriptions for future user interactions (re-arms `*Initialized` flags and auto-selects fallbacks when user changes TYPE/CLASS/GROUP).
- `MorseContext.tsx` `bump` debounced with `requestAnimationFrame` to batch rapid observable changes into one React re-render per frame.

**Flash fix (applied):** Added `restoringState` flag to `MorseLessonPlugin`. The `selectedClass.subscribe` / `letterGroup.subscribe` callbacks check `!this.restoringState` before calling `getSettingsPresets`, so no async preset fetch fires during restore. At the end of `restoreLessonState`, `getSettingsPresets(false, false)` is called once to populate the preset dropdown **without** applying any preset — user's saved wpm/fwpm/etc. from localStorage are preserved.

**Text box fix (applied):** `showRaw` initializes `true` (from `licwdefaults.json`). `setText()` branches on `showRaw()`: if `true`, it stores into `showingText` (the textarea) instead of `rawText`. The `showRaw.subscribe` that would clear `showingText` isn't wired until after the constructor. Moving `this.showRaw(false)` to just before `restoreLessonState()` in `morse.ts` ensures `setText` uses the `rawText` path during restore, so the textarea stays empty on first render.

**Remaining behavior:** The preset dropdown populates asynchronously after first paint (when the preset set file loads). This causes a single, subtle dropdown-only re-render — no settings values change.

---

### 1. Lesson Dropdown Bug Fix
**File:** `src/morse/lessons/morseLessonPlugin.ts`

**Problem:** Switching away from BC1 to any other class would blank the LESSON
dropdown permanently until the page was refreshed.

**Root causes fixed:**
- Removed `displaysInitialized = false` from inside the `displays` computed observable.
  This flag was being reset on every recompute, but the only thing that restored it
  (`childrenComplete`) doesn't fire when the array length stays the same. Once stuck
  at `false`, `setDisplaySelected` was permanently blocked.
- `displays` now returns a dummy "Select a lesson" item instead of `[]` when no word
  list matches the current filters. An empty `<select>` would leave no valid lesson
  selection, so `selectedDisplay` could become `undefined`, crashing downstream code
  that accesses `.fileName`.
- Added null guards in `applyOverrides` and `setPresetSelected` for `selectedDisplay()`.
- Added auto-select logic when exactly one lesson matches the current filters.

---

### 2. TYPE Select Fix
**Upstream (Knockout):** `src/template.html` — `event: {change: …}` on the TYPE select so `lessons.changeUserTarget` runs when TYPE changes.

**This fork (React):** `src/morse/components/app/LessonsAccordion.tsx` — the TYPE `<select>` uses `onChange` → `vm.lessons.changeUserTarget(e.target.value)`.

---

### 3. Dark Mode
**Files:** `src/css/style.css`, `src/template.html`, `src/morse/components/app/Header.tsx`

- Bootstrap 5.3 color mode: `data-bs-theme` on `<html>`; CSS under `[data-bs-theme="dark"]`.
- A small `<script>` in `<head>` reads `localStorage` and sets dark theme **before**
  CSS loads, reducing flash of the wrong mode.
- Toggle in the React header flips theme, updates `theme-color` meta, and persists `theme` in `localStorage`.
- Image inversion and extra component styling in `style.css`.

---

### 4. Logo Responsive Sizing
**File:** `src/css/style.css`

Logo scales responsively: 120px on mobile, 200px on screens ≥576px.

---

### 5. Google Analytics Removed
**File:** `src/template.html`

Google Analytics and Google Tag Manager scripts were removed from the template.

---

### 6. UI Refactor
**This fork:** Layout lives in **React** components under `src/morse/components/` (Bootstrap flex/grid). The old monolithic Knockout template is replaced by this component tree.

---

### 7. Testing Infrastructure (NEW)
**Files:** `vitest.config.ts`, `package.json`, `src/**/*.test.ts`

Added a full automated test suite using Vitest. See the **Testing** section below.

---

### 8. CI/CD Modernisation (NEW)
**Files:** `.github/workflows/`

Replaced 6 legacy GitHub Actions workflows (all using Node 12, EOL April 2022)
with 2 clean workflows using Node 20. See the **CI/CD** section below.

---

## Testing

### What is automated testing?

Testing means writing small programs that check your code automatically.
Instead of manually clicking through the app to see if something broke, you run
`npm test` and in 135ms it tells you if everything still works.

Think of it like a self-running checklist. Each test says:
> "When I give this function X, I expect to get Y back."

If you accidentally break something, the test fails and tells you exactly what
and where — before you ever open a browser.

### How to run the tests

Open a terminal in the project folder and type:

```bash
npm test
```

You will see output like this:

```
 ✓ src/morse-pro/morse-pro.test.ts         (25 tests)
 ✓ src/morse/timing/UnitTimingsAndMultipliers.test.ts (12 tests)
 ✓ src/morse/timing/ComputedTimes.test.ts  (9 tests)
 ✓ src/morse/utils/morseStringUtils.test.ts (23 tests)
 ✓ src/morse/utils/wordInfo.test.ts        (19 tests)

 Test Files  5 passed (5)
      Tests  88 passed (88)
   Duration  135ms
```

Every line with ✓ means those tests passed. If something is wrong, you'll see ✗
with a message telling you what failed and what the actual value was.

### Live mode (re-runs as you edit)

```bash
npm run test:watch
```

Leave this running while you edit code. Every time you save a file, the relevant
tests re-run instantly. Press `q` to quit.

### Coverage report

```bash
npm run test:coverage
```

This shows a table of which files have been tested and what percentage of their
code is covered by tests. Aim to keep coverage growing over time.

### Where the test files live

Each test file lives right next to the code it tests, with `.test.ts` at the end
of the filename:

```
src/
├── morse-pro/
│   ├── morse-pro.js            ← the real code
│   └── morse-pro.test.ts       ← tests for morse-pro.js
├── morse/
│   ├── timing/
│   │   ├── UnitTimingsAndMultipliers.ts
│   │   ├── UnitTimingsAndMultipliers.test.ts
│   │   ├── ComputedTimes.ts
│   │   └── ComputedTimes.test.ts
│   └── utils/
│       ├── wordInfo.ts
│       ├── wordInfo.test.ts
│       ├── morseStringUtils.ts
│       └── morseStringUtils.test.ts
```

### What each test file covers

| Test file | What it checks | Why it matters |
|-----------|---------------|----------------|
| `morse-pro.test.ts` | Morse encoding (`A`→`.-`), decoding, prosigns, looksLikeMorse | Every word played is encoded here first |
| `UnitTimingsAndMultipliers.test.ts` | PARIS timing math — WPM → milliseconds per dit | Wrong timing = wrong audio speed |
| `ComputedTimes.test.ts` | Full timing calculations from counts, including Farnsworth stretching | Audio scheduling uses these values |
| `wordInfo.test.ts` | Word parsing including `{display\|speech\|groupId}` override syntax | Lesson words and TTS both use this |
| `morseStringUtils.test.ts` | `doReplacements`, `wordifyPunctuation`, `getWords` | Unicode cleanup + abbreviation expansion for TTS |

### How to write your own test

Here is a complete example. Suppose you want to test a function called `addNumbers`:

```typescript
// 1. Import what you want to test
import { addNumbers } from './myMathFile'

// 2. Group related tests with describe()
describe('addNumbers', () => {

  // 3. Write individual tests with it()
  it('adds two positive numbers', () => {
    const result = addNumbers(2, 3)
    expect(result).toBe(5)       // ← "I expect result to be 5"
  })

  it('handles zero', () => {
    expect(addNumbers(0, 5)).toBe(5)
  })

  it('handles negative numbers', () => {
    expect(addNumbers(-1, 1)).toBe(0)
  })
})
```

Save it as `myMathFile.test.ts` in the same folder as `myMathFile.ts` and run
`npm test` — Vitest finds it automatically.

**Common `expect` checks:**

| What you write | What it checks |
|----------------|---------------|
| `expect(x).toBe(5)` | x equals 5 exactly |
| `expect(x).toBeCloseTo(5, 2)` | x ≈ 5.00 (2 decimal places — for floating point) |
| `expect(x).toContain('hello')` | string/array contains 'hello' |
| `expect(x).toHaveLength(3)` | array has 3 items |
| `expect(x).toBeNull()` | x is null |
| `expect(x).toBeTruthy()` | x is truthy (not null/undefined/0/false/'') |
| `expect(x).toBeGreaterThan(0)` | x > 0 |
| `expect(fn).toThrow()` | calling fn() throws an error |

### What Vitest cannot test (and why)

The tests only cover **pure logic** — code that takes inputs and returns outputs
with no browser involvement. Some parts of the app can't be tested this way:

- **Audio playback** — requires Web Audio API (browser only)
- **Full UI / MorseContext** — integration of ViewModel + React is exercised manually
- **Lesson dropdown cascade** — requires DOM and full app wiring
- **Text-to-speech** — requires browser speech APIs

These are tested manually by running the app in a browser. The CLAUDE.md bug-fix
section documents known issues that were caught manually and are now fixed.

---

## CI/CD — Automated Checks and Deployment

### What CI/CD means (plain English)

**CI (Continuous Integration)** means every time you push code or open a pull request,
GitHub automatically builds the project and runs all tests. If anything fails, GitHub
tells you before it can be merged. This catches mistakes early.

**CD (Continuous Deployment)** means when code merges to `main`, GitHub automatically
deploys it to both hosting locations. You don't have to rsync manually.

### Workflows (the two files in `.github/workflows/`)

#### `ci.yml` — Runs on every push to main and every pull request
1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies (`npm ci`)
4. Builds the project (`npm run build`)
5. Runs all tests (`npm test`)

If any step fails, the pull request shows a red ✗ and cannot be merged until fixed.

#### `deploy.yml` — Runs when code is merged to main
1. Builds the project
2. Deploys to **GitHub Pages** (free backup copy)
3. Deploys to **DigitalOcean** (main site at reedgames.net)

### One-time setup: DigitalOcean auto-deploy

For the DigitalOcean deploy step to work, you must add four **GitHub Secrets**
(these are like passwords stored safely in GitHub, not in the code):

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each of these:

| Secret name | What to put in it |
|-------------|------------------|
| `DO_SSH_KEY` | Your private SSH key. On your Mac, open Terminal and run: `cat ~/.ssh/id_rsa` — copy the entire output including the `-----BEGIN...-----` lines |
| `DO_HOST` | Your DigitalOcean droplet's IP address (e.g. `123.45.67.89`) |
| `DO_USER` | The Linux username you SSH in as (usually `root`) |
| `DO_PATH` | The folder on the droplet where the site lives (e.g. `/var/www/html/morsebrowser`) |

Once set, every merge to `main` will automatically rsync the built `dist/` to your droplet.

### One-time setup: GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under **Source**, choose **Deploy from a branch**
3. Branch: `gh-pages`, folder: `/ (root)`
4. Save

The backup copy will be at: `https://rdreed21.github.io/morsebrowser/`

---

## Build & Deploy Commands (Manual)

```bash
# Local development (hot reload at http://localhost:3000)
npm run dev

# Production build (output goes to dist/)
npm run build

# Manual deploy to DigitalOcean droplet
rsync -avz --delete dist/ user@your-droplet-ip:/var/www/html/morsebrowser/

# Check Let's Encrypt cert renewal status
ssh user@your-droplet-ip 'systemctl status certbot.timer'
```

---

## Project Overview

MorseBrowser is a browser-based Morse code practice tool for the Long Island CW Club.
It runs entirely as static files — no server-side code. The UI is **React** with a
**MorseViewModel** bridge (`MorseContext`). Full technical documentation is in `DOCUMENTATION.md`.

**Live sites:**
- Upstream (LICW): https://longislandcw.github.io/morsebrowser/
- This fork backup: https://rdreed21.github.io/morsebrowser/ *(after Pages setup)*
- Main site: reedgames.net *(DigitalOcean)*
