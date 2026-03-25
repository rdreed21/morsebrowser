# MorseBrowser Modernization Plan

## Context

MorseBrowser is a browser-based Morse code practice app for the Long Island CW Club. It runs entirely as static files with no server. The codebase is functional and well-documented. The goal is to identify and implement modernizations that improve maintainability, reliability, and developer experience without disrupting the app's core purpose or its "ham tinkerer-friendly" philosophy.

Many items below are **done** in this fork; status is called out per section.

---

## Modernization Areas (Prioritized)

### 1. Testing Infrastructure

**Original problem:** No automated tests.

**Status:** **Done** — Vitest is configured (`vitest.config.ts`), `npm test` runs the suite, and `src/**/*.test.ts` covers pure logic (timing, morse-pro, string utils, word info, etc.). Integration-style UI tests are still manual.

---

### 2. TypeScript Strictness

**Original problem:** Loose `tsconfig`; prebuild scripts in JavaScript.

**Status:** **Partially done** — Prebuild and zip utilities are TypeScript (`prebuildLessons.ts`, `prebuildPresetSets.ts`, `prebuildPresets.ts`, `zipdist.ts`). Full `strict: true` in `tsconfig.json` may still be a future incremental effort.

---

### 3. Dependency & Tooling Updates

**Original problem:** Old Node in CI, aging dependencies.

**Status:** **Largely done** — See `package.json` (e.g. React 19, Bootstrap 5.3, TypeScript 5.x, Webpack 5). CI uses Node 20 (see `.github/workflows/`). Further dependency bumps can continue on a normal cadence.

---

### 4. Webpack Production Build

**Original problem:** No production mode in scripts.

**Status:** **Done** — `npm run build` uses `webpack --mode=production`; `npm run dev` uses development mode.

---

### 5. CI/CD Cleanup

**Original problem:** Many legacy workflows and old Node.

**Status:** **Done** in this fork — Consolidated workflows and Node 20 (see [CLAUDE.md](CLAUDE.md) CI/CD section).

---

### 6. Bootstrap Dark Mode

**Original problem:** Custom `data-theme` only; Bootstrap 5.3 color modes.

**Status:** **Done** — Bootstrap 5.3+ with `data-bs-theme` on the document root; see `src/template.html`, `src/css/style.css`, and `src/morse/components/app/Header.tsx`.

---

### 7. UI Framework: React + ViewModel Bridge

**Original problem:** Knockout.js and a very large HTML template were hard to maintain.

**Status:** **UI migrated to React** — The page shell is minimal HTML (`src/template.html`); the UI is implemented in React under `src/morse/components/`. `MorseViewModel` remains the core of app logic, using **custom observables** (`src/morse/utils/observable.ts`), not the Knockout runtime. `MorseContext` subscribes to those observables and mirrors state into React.

**Remaining optional work:** Gradually move more state and logic out of the ViewModel into idiomatic React (or reduce duplicate mirroring in `MorseContext`) if the team wants a thinner bridge — not a blocker for shipping.

---

## Recommended Execution Order (historical)

The list below reflected the original roadmap. For this fork, items 1–6 and the React UI portion of item 7 are already addressed; remaining work is incremental (stricter TypeScript, more tests, optional ViewModel slimming).

1. Node/CI upgrade
2. Vitest + tests
3. TypeScript strictness / JS → TS prebuilds
4. Dependency updates
5. Webpack production mode
6. Bootstrap dark mode (`data-bs-theme`)
7. React UI (done); optional further refactors

---

## Files Affected (reference)

| Area | Files |
|------|--------|
| CI | `.github/workflows/*.yml` |
| Tests | `vitest.config.ts`, `src/**/*.test.ts` |
| Prebuild | `prebuildLessons.ts`, `prebuildPresets.ts`, `prebuildPresetSets.ts` |
| Build | `webpack.config.js`, `package.json` |
| Shell | `src/template.html` |
| UI | `src/App.tsx`, `src/index.tsx`, `src/morse/components/**/*.tsx`, `src/morse/context/MorseContext.tsx` |
| Logic | `src/morse/morse.ts`, `src/morse/utils/observable.ts` |

---

## Verification

- `npm test` — all tests pass
- `npm run build` — production build completes without errors, output in `/dist/`
- `npm run dev` — dev server starts on port 3000, app loads and plays Morse audio
- GitHub Actions CI passes on push
- App functions as expected: lessons load, audio plays, settings persist
