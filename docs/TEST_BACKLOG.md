# Test backlog: production-grade coverage plan (P0–P5)

**Tracking issue:** [rdreed21/morsebrowser#4](https://github.com/rdreed21/morsebrowser/issues/4) — keep this file and the issue in sync when the backlog changes.

---

## Context

The Vitest suite now includes **135+ tests** (including P0/P1 items below). Core pure logic remains strong: Morse encode/decode (`morse-pro.js`), timing (`ComputedTimes`, `UnitTimingsAndMultipliers`), `wordInfo`, `morseStringUtils`, observables, lesson plugin (mocked), settings slices, and wordlists integrity. React UI, full `MorseViewModel` construction, audio playback, and `MorseCookies.loadCookiesOrDefaults` end-to-end are still largely untested.

This document is a **priority backlog** to make the codebase safe to modify and ship with confidence (production-style regression detection).

---

## Status (implemented in repo)

**P0 / P1 baseline:** Vitest coverage added for `observable`, `MorseTimingCalculator`, settings serialization (`SpeedSettings`, `FrequencySettings`, `MorseSettingsHandler.getCurrentSerializedSettings`), `wordlists.json` ↔ `src/wordfiles/` integrity (`scripts/wordlists-integrity.ts` + `src/wordlistsIntegrity.test.ts`), `MorseLessonPlugin` (mocked finder), `MorsePresetFileFinder`, `FlaggedWords`, `GeneralUtils`, and extra cases for `WordInfo` / `MorseStringUtils`. **Data fix:** `wordlists.json` had broken `fileName` entries (`Fam_Words â€“ 4.txt`, `Fam_LN.txt`); corrected to match files on disk.

---

## P0 — Safety, persistence, silent wrongness

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P0 | Settings save/load contract tests | `morse/settings/*`, `morse/cookies/morseCookies.ts`, `morse/settings/morseSettingsHandler.ts` | Defaults, migrations, cookie/localStorage keys, round-trip integrity |
| P0 | `observable` unit tests | `morse/utils/observable.ts` | Subscriptions, disposal, computed behavior; prevents React/state desync |
| P0 | `morseTimingCalculator` tests | `morse/timing/morseTimingCalculator.ts`, `TimeLineInfo.ts` if used | Scheduling math beyond existing `ComputedTimes` coverage |
| P0 | Prebuild / data integrity in CI | `prebuildLessons.ts`, `prebuildPresetSets.ts`, `prebuildPresets.ts`, `checklessons.js`, generated wordlists/presets | Invalid or broken lesson data never ships |

---

## P1 — Core domain (ViewModel + lessons/presets)

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P1 | `MorseViewModel` / `morse.ts` tests (pure seams first) | `morse/morse.ts` | Practice flow, word advance, repeat rules |
| P1 | `morseLessonPlugin` tests | `morse/lessons/morseLessonPlugin.ts` | Filter cascade, `selectedDisplay`, TYPE/target changes, empty filters, auto-select |
| P1 | Preset / lesson finder tests (fixture-based) | `morse/morsePresetFinder.js`, `morsePresetSetFinder.js`, `morseLessonFinder.js` | Correct mapping from class/filters to material |
| P1 | `wordInfo` branch coverage | `morse/utils/wordInfo.ts` | Override syntax, TTS vs display edge cases |
| P1 | `morseStringUtils` / `general` edge cases | `morse/utils/morseStringUtils.ts`, `morse/utils/general.ts` | Unicode, abbreviations, punctuation |
| P1 | `flaggedWords` tests | `morse/flaggedWords/flaggedWords.ts` | Add/remove and related behavior |

---

## P2 — Audio / player (mocked / deterministic)

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P2 | WAV buffer / header tests | `morse/player/wav/morseStringToWavBuffer.ts`, `CreatedWav.ts` | Deterministic audio output shape |
| P2 | `morseWordPlayer` with fake clock / mocks | `morse/player/morseWordPlayer.ts` | Callback order and timing |
| P2 | Smoothed / WAV player tests with mocks | `SmoothedSoundsPlayer.ts`, `morseWavBufferPlayer.ts` | Lifecycle, cleanup, error paths |
| P2 | Extended `morse-pro` coverage (where used) | Selected `morse-pro-*.js` | Decoder/listener paths actually imported by the app |

---

## P3 — RSS, shortcuts, voice

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P3 | `morseRssPlugin` + mocked fetch | `morse/rss/morseRssPlugin.ts`, `RssConfig.ts`, `RssTitle.ts` | Parse failures, empty/malformed feeds |
| P3 | `morseShortcutKeys` tests | `morse/shortcutKeys/morseShortcutKeys.ts` | Key → action mapping |
| P3 | `MorseVoice` tests with mocks | `morse/voice/MorseVoice.ts` | Queueing, interrupt, errors without real `speechSynthesis` |

---

## P4 — React UI

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P4 | React Testing Library + Vitest jsdom | `LessonsAccordion.tsx`, `Controls.tsx`, `WorkingText.tsx`, etc. | DOM wiring (e.g. TYPE `onChange` → `changeUserTarget`) |
| P4 | `MorseContext` integration tests | `morse/context/MorseContext.tsx` | Observable → React mirroring, typical mount sequences |
| P4 | (Optional) Visual regression | Key screens | Layout/CSS regressions |

---

## P5 — End-to-end

| Priority | What to create | Code / area | Protects |
|----------|----------------|-------------|----------|
| P5 | Playwright (or Cypress) critical paths | Full app, production build | Lesson select, play (audio stubbed/muted), theme, settings survive reload |
| P5 | E2E against `npm run build` artifact | Static server + built `dist/` | Minified/webpack output correctness |

---

## Suggested tooling

- `@testing-library/react`, Vitest `environment: jsdom` (or separate project config) for P4
- Playwright (or Cypress) for P5
- MSW or similar for mocked HTTP in P3
- CI: run unit tests + prebuild checks on every PR; add E2E on `main` or PRs once stable

---

## Acceptance

Track remaining work here or in child issues. **P0/P1 baseline** is partially implemented (see Status above); P2–P5 remain. Split large items (for example full `morse.ts` tests) into focused PRs.
