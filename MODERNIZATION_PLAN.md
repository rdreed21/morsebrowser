# MorseBrowser Modernization Plan

## Context
MorseBrowser is a browser-based Morse code practice app for the Long Island CW Club. It runs entirely as static files with no server. The codebase is functional and well-documented but uses 2021–2022-era tooling and patterns. The goal is to identify and implement modernizations that improve maintainability, reliability, and developer experience without disrupting the app's core purpose or its "ham tinkerer-friendly" philosophy.

---

## Modernization Areas (Prioritized)

### 1. Testing Infrastructure (Critical – Zero Tests Today)
**Problem:** No tests exist. No test framework is configured.
**Solution:** Add Vitest (works natively with TypeScript + Webpack 5 projects, fast, modern)
- Unit test pure logic: timing calculations, WAV generation, cookie handlers, word list parsers
- Integration test key flows: lesson loading, settings persistence, audio sequencing
- Test key files: `src/morse/timing/`, `src/morse/wav/`, `src/morse/cookies/`, `src/morse/utils/`
- Add `test` script to package.json
**Files to add:** `vitest.config.ts`, `src/**/*.test.ts`

### 2. TypeScript Strictness (High)
**Problem:** `noImplicitAny: false` in tsconfig; 4 remaining `.js` files; loose typing allows silent bugs.
**Solution:**
- Enable `"strict": true` in `tsconfig.json` (or incrementally: `noImplicitAny`, `strictNullChecks`)
- Convert the 4 remaining JS files to TypeScript:
  - `prebuildLessons.js`, `prebuildPresets.js`, `prebuildPresetSets.js`, `zipdist.js`
- Fix any resulting type errors
**Files:** `tsconfig.json`, `prebuild*.js` → `.ts`

### 3. Dependency & Tooling Updates (Medium)
**Problem:** Several packages are 2–3 years old; Node 12.x used in CI (EOL April 2022).
**Solution:**
- Update GitHub Actions to Node 18 LTS or Node 20 LTS
  - Files: `.github/workflows/*.yml`
- Update TypeScript 4.7.2 → 5.x
- Update Bootstrap 5.1.3 → 5.3.x (adds dark mode utilities, color modes)
- Update ESLint 8.16 → 8.57+ (latest 8.x before 9.x breaking changes)
- Update Webpack 5.68 → 5.90+
- Update Babel 7.17 → 7.23+
- Remove IE-era polyfills (promise-polyfill likely unnecessary for modern browsers)
**Files:** `package.json`, `.github/workflows/*.yml`

### 4. Webpack Production Build (Medium)
**Problem:** `webpack.config.js` hardcodes `mode: 'development'`; no production optimizations.
**Solution:**
- Split into `webpack.config.dev.js` and `webpack.config.prod.js` (or use `--mode` flag)
- Production config: minification, tree-shaking, source maps for debugging
- Update npm scripts: `"build": "webpack --mode=production"`, `"dev": "webpack serve --mode=development"`
**Files:** `webpack.config.js`, `package.json`

### 5. CI/CD Cleanup (Medium)
**Problem:** 6 workflow files in `.github/workflows/` — several appear to be legacy/duplicates (`main2.yml`, `develop2.yml`).
**Solution:**
- Audit and consolidate to 2 workflows: `ci.yml` (PR checks) and `deploy.yml` (main branch deploy)
- Upgrade Node version to 18 or 20 LTS
- Add `npm test` step to CI once tests exist
**Files:** `.github/workflows/`

### 6. Bootstrap Dark Mode (Low–Medium)
**Problem:** Current dark mode uses a custom `data-theme` CSS variable approach; Bootstrap 5.3 introduced native `data-bs-theme` color modes.
**Solution:**
- Upgrade Bootstrap to 5.3.x
- Migrate `data-theme` toggle to `data-bs-theme` on the `<html>` element
- Remove or reduce custom dark mode CSS overrides where Bootstrap covers them
**Files:** `src/css/style.css`, `src/template.html`, relevant ViewModel code

### 7. Framework Modernization (Low – Optional / Long-term)
**Problem:** Knockout.js is functional but last released in 2018; large monolithic 1056-line template.
**Note:** This is a significant rewrite. Given the "tinkerer-friendly" philosophy and the size of the codebase (48 TS files, 600+ word lists, complex audio system), this should only be done if the team is committed to it. React or Vue would be the natural targets.
**Recommendation:** Defer unless the team has bandwidth. Focus on testing and strict TypeScript first — this makes any future migration safer and more incremental.

---

## Recommended Execution Order

1. **Node/CI upgrade** (`.github/workflows/`) — fast, low-risk, unblocks everything else
2. **Add Vitest + write initial tests** — establishes safety net before other changes
3. **TypeScript strictness** — catch hidden bugs, convert JS prebuild files to TS
4. **Dependency updates** — Bootstrap, TS, Webpack, ESLint, Babel
5. **Webpack production build split** — proper build/dev separation
6. **Bootstrap dark mode migration** — cosmetic cleanup
7. **Framework migration** — only if team decides to invest in it

---

## Files Affected (by priority)

| File | Change |
|------|--------|
| `.github/workflows/*.yml` | Node 12 → 18/20, consolidate workflows |
| `package.json` | Add vitest, update deps |
| `tsconfig.json` | Enable strict mode |
| `prebuildLessons.js`, `prebuildPresets.js`, `prebuildPresetSets.js` | Convert to TS |
| `webpack.config.js` | Split dev/prod, fix mode |
| `src/css/style.css` | Bootstrap 5.3 dark mode migration |
| `src/template.html` | `data-theme` → `data-bs-theme` |
| `src/**/*.test.ts` (new) | Test files for timing, wav, cookies, utils |
| `vitest.config.ts` (new) | Test configuration |

---

## Verification

- `npm test` — all tests pass
- `npm run build` — production build completes without errors, output in `/dist/`
- `npm run dev` — dev server starts on port 3000, app loads and plays Morse audio
- GitHub Actions CI passes on push
- App functions identically to pre-modernization: lessons load, audio plays, settings persist
