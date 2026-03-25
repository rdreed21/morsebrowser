# MorseBrowser — Complete Project Documentation

**Long Island CW Club (LICW) — Morse Code Practice Web Application**
Version 1.13 | Stack: TypeScript + React + Webpack 5 + Bootstrap 5

---

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Technology Stack](#2-technology-stack)
3. [Repository Layout](#3-repository-layout)
4. [Architecture Overview](#4-architecture-overview)
5. [React UI and the ViewModel](#5-react-ui-and-the-viewmodel)
6. [Major Modules](#6-major-modules)
   - 6.1 [MorseViewModel — Root Controller](#61-morseviewmodel--root-controller)
   - 6.2 [Lesson System (morseLessonPlugin)](#62-lesson-system-morselessonplugin)
   - 6.3 [Audio Engine](#63-audio-engine)
   - 6.4 [Timing Calculator](#64-timing-calculator)
   - 6.5 [Settings Layer](#65-settings-layer)
   - 6.6 [Voice (Text-to-Speech)](#66-voice-text-to-speech)
   - 6.7 [morse-pro Libraries](#67-morse-pro-libraries)
   - 6.8 [RSS Plugin](#68-rss-plugin)
7. [Data Model](#7-data-model)
   - 7.1 [Word Lists](#71-word-lists)
   - 7.2 [Lesson Classes & Presets](#72-lesson-classes--presets)
   - 7.3 [Configuration Files](#73-configuration-files)
8. [Lesson Selection Cascade (End-to-End)](#8-lesson-selection-cascade-end-to-end)
9. [Audio Playback Pipeline (End-to-End)](#9-audio-playback-pipeline-end-to-end)
10. [Build Pipeline](#10-build-pipeline)
11. [UI Structure](#11-ui-structure)
12. [State Persistence](#12-state-persistence)
13. [Dark Mode](#13-dark-mode)
14. [Keyboard Shortcuts](#14-keyboard-shortcuts)
15. [Admin & Debug Features](#15-admin--debug-features)
16. [Development Workflow](#16-development-workflow)
17. [Deployment](#17-deployment)
18. [Fork Changes vs Upstream](#18-fork-changes-vs-upstream)
19. [Glossary](#19-glossary)
20. [Maintainer guide (design & content flow)](docs/MAINTAINER_GUIDE.md)

---

## 1. What This App Does

MorseBrowser is a **browser-based Morse code practice tool** built for the Long Island CW Club. It lets ham radio operators:

- Learn Morse code progressively through structured lesson classes (BC1 → BC2 → BC3 → Intermediate → Advanced)
- Play back words/phrases as Morse code audio through the browser's Web Audio API
- Hear words spoken aloud via text-to-speech ("Speak First" mode) before or after the Morse tones
- Choose word lists by difficulty, letter group, and lesson type (Recognition, TTR, VET, etc.)
- Adjust speed (WPM), tone frequency (Hz), volume, spacing, and noise background
- Track practice sessions with word cards showing progress
- Shuffle, repeat, or advance through practice sets
- Persist all preferences across sessions via browser cookies/localStorage

The app is intentionally built with **accessible, "ham-tinkerer-friendly" code** — no server requirement. The UI is **React**; core logic lives in `MorseViewModel` with custom observables. It runs entirely in the browser from static files.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|--------|
| UI | React | Components under `src/morse/components/`; `MorseContext` bridges the ViewModel |
| ViewModel | `MorseViewModel` + custom observables | `src/morse/utils/observable.ts` (KO-like API, not Knockout.js) |
| CSS framework | Bootstrap | 5.3.x |
| Language | TypeScript + JavaScript | TS 5.x; `src/morse-pro/` remains JS |
| Build tool | Webpack | 5.x |
| Transpiler | Babel | 7.x |
| Audio | Web Audio API (browser built-in) | — |
| Speech | EasySpeech (wrapper) | 2.3.1 |
| State | js-cookie + localStorage | 3.0.1 |
| RSS | rss-parser | 3.12.0 |
| Noise | pink-noise-node, white-noise-node, brown-noise-node | — |
| Linting | ESLint + @typescript-eslint | — |
| Tests | Vitest | `npm test` |

---

## 3. Repository Layout

```
morsebrowser/
├── src/                        # All source code
│   ├── index.tsx               # Webpack entry — Bootstrap, MorseViewModel, React root
│   ├── App.tsx                 # MorseProvider + main layout
│   ├── template.html           # Minimal HTML shell (#react-root, theme script)
│   ├── assets/                 # Static images (logos, favicons, icons)
│   ├── css/
│   │   └── style.css           # Bootstrap 5 + dark mode + responsive
│   ├── configs/
│   │   ├── licwdefaults.json   # Default startup values (WPM, freq, text, etc.)
│   │   └── wordify.json        # Abbreviation → spoken word mappings for TTS
│   ├── morse/                  # Main application TypeScript modules
│   │   ├── morse.ts            # ROOT: MorseViewModel class
│   │   ├── context/
│   │   │   └── MorseContext.tsx  # Subscribes to VM observables → React state
│   │   ├── lessons/
│   │   │   └── morseLessonPlugin.ts   # Entire lesson selection system
│   │   ├── player/             # Audio player abstraction
│   │   ├── timing/             # PARIS timing algorithm
│   │   ├── settings/           # Settings encapsulation
│   │   ├── voice/              # Text-to-speech
│   │   ├── utils/              # observables, string helpers, word info, card buffer
│   │   └── components/         # React UI (accordions, controls, header, …)
│   ├── morse-pro/              # External Morse encode/decode libraries (SC Phillips)
│   ├── presets/                # Lesson class definitions and preset configs
│   │   ├── config.json         # Class list (BC1, BC2, INT1, ADV1, …)
│   │   ├── sets/               # Per-class lesson sets (BC1.json, INT2.json, …)
│   │   ├── configs/            # Per-preset settings overrides
│   │   └── overrides/          # Additional setting overrides
│   ├── wordfiles/              # 600+ .txt and .json word list files
│   ├── wordfilesconfigs/
│   │   └── wordlists.json      # Master index of all word lists
│   └── easyspeech/             # EasySpeech TTS wrapper
├── dist/                       # Build output (generated — do not edit)
├── webpack.config.js           # Webpack configuration
├── tsconfig.json               # TypeScript compiler options
├── package.json                # npm scripts and dependencies
├── .babelrc                    # Babel transpilation config
├── .eslintrc.json              # Linting rules
├── prebuildLessons.ts          # Generates morseLessonFinder at build time
├── prebuildPresets.ts          # Generates morsePresetFinder at build time
├── prebuildPresetSets.ts       # Generates morsePresetSetFinder at build time
├── checklessons.js             # Post-build: validates lesson data integrity
├── zipdist.ts                  # Post-build: packages dist/ into morse.zip
├── vitest.config.ts            # Unit test runner config
├── CLAUDE.md                   # Fork-specific change log
└── DOCUMENTATION.md            # This file
```

---

## 4. Architecture Overview

The app is a **Single Page Application (SPA)**. The **view** is **React**; the **model/controller** is **`MorseViewModel`**, which keeps MVVM-style separation of concerns without using the Knockout.js library.

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  React components ←─ MorseContext ─→ MorseViewModel   │
│       │                                      │          │
│       │ (renders)                    (owns/controls)    │
│       ▼                                      ▼          │
│  Bootstrap 5 UI              ┌───────────────────────┐  │
│  Dark mode CSS               │ Plugins & Sub-modules │  │
│                              │ • LessonPlugin        │  │
│                              │ • MorseVoice          │  │
│                              │ • morseWordPlayer     │  │
│                              │ • TimingCalculator    │  │
│                              │ • Settings            │  │
│                              │ • RssPlugin           │  │
│                              └───────────────────────┘  │
│                                      │                  │
│                              Web Audio API              │
│                              (browser built-in)         │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** `MorseViewModel` holds state in **custom observables** (`observable`, `computed`, `observableArray` from `src/morse/utils/observable.ts`). **`MorseContext`** subscribes to the observables the UI needs and copies values into React state so components re-render. User actions call ViewModel methods or observable setters (often via `vm` from the context).

---

## 5. React UI and the ViewModel

The UI is implemented as **React function components** under `src/morse/components/`. They read synchronized fields via **`useMorse()`** and mutate state through **`morse.vm`** (e.g. `morse.vm.volume(5)`).

The **observable** layer matches the subset of Knockout’s API used by the original app: `observable()` returns a function that gets/sets a value and supports `.subscribe()`. **`computed()`** and **`writableComputed()`** take an explicit dependency list (unlike Knockout’s automatic dependency tracking).

| Concept | What it means |
|---------|--------------|
| `observable(value)` | Reactive variable; `subscribe` notifies listeners when the value changes. |
| `observableArray([...])` | Array-valued observable with helper mutators. |
| `computed(fn, deps)` | Derived value; re-runs when any listed dependency changes. |
| React + `MorseContext` | Mirrors selected observables into React state for rendering. |

Example: when the user changes WPM, the setting’s observable updates, timing recomputes, and both the audio pipeline and any React-bound display fields stay in sync.

---

## 6. Major Modules

### 6.1 MorseViewModel — Root Controller

**File:** [src/morse/morse.ts](src/morse/morse.ts)

This is the **central hub** of the application. It is instantiated once in `src/index.tsx` and passed into **`MorseProvider`** so React components share the same instance.

**Key observables:**
| Observable | Type | Purpose |
|-----------|------|---------|
| `textBuffer` | string | The text being practiced |
| `playerPlaying` | boolean | Is audio currently playing? |
| `volume` | number | Playback volume 0–100 |
| `wordIndex` | number | Current position in word list |
| `playerMode` | string | 'word', 'sentence', 'text' |
| `showSettings` | boolean | Settings panel visibility |

**Key methods:**
| Method | What it does |
|--------|-------------|
| `doPlay()` | Starts or resumes playback |
| `doStop()` | Stops playback |
| `doPause()` | Pauses playback |
| `setText(text)` | Loads new text into the practice buffer |
| `shuffleWords()` | Randomises word order |
| `incrementIndex()` | Advances to next word |
| `decrementIndex()` | Goes back one word |

**Initialisation sequence:**
1. Loads `licwdefaults.json` config
2. Instantiates Settings, LessonPlugin, MorseVoice, RssPlugin
3. Restores cookies (saved class, lesson, WPM, etc.)
4. React mounts under `#react-root`; `MorseContext` attaches subscriptions to observables the UI reads

---

### 6.2 Lesson System (morseLessonPlugin)

**File:** [src/morse/lessons/morseLessonPlugin.ts](src/morse/lessons/morseLessonPlugin.ts)

This is the **most complex module** in the codebase. It manages the three-level cascade:
**CLASS → LESSON → (auto-loads word list)**

**Key observables:**
| Observable | Purpose |
|-----------|---------|
| `selectedClass` | Currently chosen class (e.g. "BC1") |
| `selectedDisplay` | Currently chosen lesson display option |
| `userTarget` | Selected letter group / TYPE filter |
| `classes` | Computed list of available classes |
| `displays` | Computed list of lesson options for current class |

**Critical design decisions:**
- `displays` must **never return an empty array**. If no word list matches the current filters, it returns a dummy "Select a lesson" item. An empty lesson `<select>` would leave **no valid selection**, so `selectedDisplay` could become `undefined` and crash code that accesses `.fileName`.
- `displaysInitialized` flag gates `setDisplaySelected` calls during page load, preventing premature word list loading before the DOM is ready.
- Cookie persistence saves/restores `selectedClass`, `selectedDisplay`, and `userTarget` across sessions.

**Lesson types (display options):**
| Name | Description |
|------|-------------|
| Recognition | Hear morse, identify word |
| TTR | Two-tone recognition |
| VET | Variable element timing |
| Callsign | Practice callsigns |
| QSO | Practice QSO phrases |
| Default | General vocabulary |

---

### 6.3 Audio Engine

**Files:** [src/morse/player/](src/morse/player/)

The player is abstracted through `morseWordPlayer.ts`, which delegates to one of two backends:

**SmoothedSoundsPlayer** — Real-time audio
- Uses Web Audio API oscillator nodes
- Generates sine waves with envelope smoothing (no clicks)
- Best for immediate playback

**WavBufferPlayer** — Pre-rendered WAV
- Pre-renders morse audio into a WAV ArrayBuffer
- Plays back via `AudioBufferSourceNode`
- More consistent timing for faster speeds

**Noise generators** (optional, layered):
- Pink noise — most natural sounding, simulates band noise
- White noise — flat spectrum
- Brown noise — lower-frequency rumble

---

### 6.4 Timing Calculator

**Files:** [src/morse/timing/](src/morse/timing/)

Implements the **PARIS standard** for Morse timing.

The word "PARIS" is used as the timing standard: it contains 50 units at standard speed.
`1 WPM = word PARIS in 60 seconds = 1.2 seconds per word`

**Key classes:**
| Class | Purpose |
|-------|---------|
| `morseTimingCalculator.ts` | Entry point — converts WPM → millisecond timings |
| `UnitTimingsAndMultipliers.ts` | Core math: dit duration, dah multiplier, spacing multipliers |
| `ComputedTimes.ts` | Final ms values for dit, dah, inter-element, inter-character, word spaces |
| `TimeLineInfo.ts` | Event timeline: array of `{type, time}` objects for audio scheduling |

**Farnsworth timing (FWPM):**
When FWPM < WPM, character elements play at WPM speed but gaps between characters are stretched to achieve the slower FWPM overall pace. This helps learners identify characters at full speed while having more thinking time between them.

---

### 6.5 Settings Layer

**Files:** [src/morse/settings/](src/morse/settings/)

Settings are organised into four groups:

| File | Settings |
|------|---------|
| `speedSettings.ts` | WPM, FWPM, variable speed, ramp settings |
| `frequencySettings.ts` | Dit Hz, Dah Hz |
| `miscSettings.ts` | Volume, pre-space, word spacing, card font size |
| `settings.ts` | Aggregates all groups |
| `morseSettingsHandler.ts` | Applies setting changes to the player |

Each setting follows the **cookie handler pattern**:
```typescript
interface ICookieHandler {
  save(): void;       // writes current value to cookie
  load(): void;       // reads cookie and restores value
  getKey(): string;   // unique cookie name
}
```

---

### 6.6 Voice (Text-to-Speech)

**File:** [src/morse/voice/MorseVoice.ts](src/morse/voice/MorseVoice.ts)

Wraps the browser's Web Speech API via the **EasySpeech** library.

**Speak First mode:** Before playing Morse tones, the app speaks the word aloud. This helps beginners associate the sound of a word with its Morse representation.

**wordify.json mapping:** Before speaking, abbreviations are expanded:
- `QRM` → "Q R M"
- `FB` → "Fine business"
- `ES` → "And"
- `<AR>` → "End of message"
- State abbreviations → full state names

**Configurable:** Voice, pitch, rate, volume all controllable. Falls back gracefully if TTS is unavailable.

---

### 6.7 morse-pro Libraries

**Files:** [src/morse-pro/](src/morse-pro/)

Third-party Morse encode/decode library by **SC Phillips**. These are not modified — included as-is.

| File | Purpose |
|------|---------|
| `morse-pro.js` | Text → Morse (A→.-, B→-..., etc.) and reverse |
| `morse-pro-cw.js` | CW (continuous wave) generation |
| `morse-pro-wpm.js` | WPM calculation helpers |
| `morse-pro-player-waa.js` | Web Audio API player |
| `morse-pro-keyer.js` | Straight key / paddle keyer simulation |
| `morse-pro-listener.js` | Audio → Morse decoding |
| `morse-pro-decoder.js` | Morse string decoder |

**Prosigns supported:** `<AA>`, `<AR>`, `<AS>`, `<BK>`, `<BT>`, `<CL>`, `<KN>`, `<SK>`, `<SOS>`, `<VE>`

---

### 6.8 RSS Plugin

**File:** [src/morse/...RssPlugin](src/morse/)

Enabled via `?rssEnabled=true` query parameter. Allows fetching text from external RSS feeds for practice material. Uses `rss-parser` library to fetch and parse feeds, then populates the text buffer.

---

## 7. Data Model

### 7.1 Word Lists

**Location:** [src/wordfiles/](src/wordfiles/) — 600+ files

Two formats:

**Plain text (.txt):**
One word per line. Used directly as a list of words to practice.
```
the
and
for
```

**Structured JSON (.json):**
Contains generation parameters — the word list is built from these rules at runtime.
```json
{
  "letters": "reatinpgslcdhofuwbkmy59,qxv73?<AR><SK><BT>16.zj/28BK40",
  "minWordSize": 3,
  "maxWordSize": 3,
  "practiceSeconds": 120
}
```
- `letters` — the character set for the current lesson level (Koch method progression)
- `minWordSize` / `maxWordSize` — constrain generated word lengths
- `practiceSeconds` — recommended practice duration

**File naming conventions:**
```
BC1_Default.json          ← Class BC1, Default lesson
ADV1_FAM_Phrases_2W.txt   ← Advanced 1, Familiar Phrases, 2 words
Words_10L.txt             ← 10-letter words (all classes)
Callsigns_NA.txt          ← North American callsigns
```

### 7.2 Lesson Classes & Presets

**Location:** [src/presets/](src/presets/)

**`config.json`** defines the class list:
```json
{
  "classes": ["BC1", "BC2", "BC3", "INT1", "INT2", "INT3", "ADV1", "ADV2", "ADV3", "POL", "TTR+", "COM", "A"],
  "defaultPreset": { "BC1": "BC1_Default", ... }
}
```

**`sets/BC1.json`** example — list of lessons available for BC1:
```json
[
  { "display": "Recognition", "fileName": "BC1_Default" },
  { "display": "TTR",         "fileName": "BC1_TTR" },
  { "display": "VET",         "fileName": "BC1_VET" }
]
```

**`configs/BC1_Default.json`** — settings applied when that lesson is selected:
```json
{
  "wpm": 12,
  "fwpm": 10,
  "volume": 10,
  "prespace": 2
}
```

**Class progression:**
```
BC1 → BC2 → BC3    (Beginner — Koch method letter introduction)
INT1 → INT2 → INT3 (Intermediate — words, abbreviations, QSOs)
ADV1 → ADV2 → ADV3 (Advanced — full QSO, DX pileups)
POL                 (Overlearning / consolidation)
TTR+                (Two-tone recognition extended)
COM                 (Competition speed)
A                   (Assessment)
```

### 7.3 Configuration Files

**`src/configs/licwdefaults.json`** — Startup defaults:
```json
{
  "defaultText": "{CQ|c q} {LICW|l i c w}",
  "wpm": 12,
  "ditFrequency": 500,
  "dahFrequency": 500,
  "prespace": 2,
  "extraWordSpacing": 1,
  "volume": 10,
  "stickySets": "BK",
  "cardFontSize": "15px"
}
```

**`src/configs/wordify.json`** — TTS pronunciation mappings (155 entries):
- Q-codes: `QRM`, `QRN`, `QRS`, `QRZ`, `QTH`, etc.
- Prosigns: `<AR>`, `<SK>`, `<BT>`, `<SOS>`
- US states, Canadian provinces (two-letter codes → full names)
- Common abbreviations: `FB`, `ES`, `OM`, `YL`, `DX`, `73`, `88`

---

## 8. Lesson Selection Cascade (End-to-End)

Understanding this flow is essential for maintaining the lesson system.

```
User Action                  → What Happens in Code
─────────────────────────────────────────────────────────
1. Page loads                → Restore cookies (class, lesson, letter group)
                               OR use defaults (BC1)

2. User picks CLASS           → changeClass()
   e.g. BC1 → INT1             clearLetterGroup()
                               clearUserTarget()
                               classes observable updates
                               ↓
                             displays computed recomputes
                               Filters wordlists.json by class
                               Returns matching DisplayOptions[]
                               If empty → returns [dummy "Select a lesson"]

3. LESSON dropdown updates   → React re-renders `<select>` options from `displays`
                               If exactly 1 real option → auto-select it
                               If multiple → user must choose

4. User picks LESSON          → setDisplaySelected(displayOption)
   e.g. "Recognition"          Loads preset JSON (morsePresetFinder)
                               Calls applyOverrides() → merges settings
                               Calls setText() → loads words from wordlist
                               Saves cookie

5. Words populated           → Word cards appear
                               Play button becomes active
```

**Common pitfall:** If `displays` ever returns `[]` (empty array), the lesson dropdown has no valid value and `selectedDisplay` can become `undefined`, which crashes code that accesses `selectedDisplay().fileName`. The fix: always return at least a dummy item.

---

## 9. Audio Playback Pipeline (End-to-End)

```
User clicks Play
    │
    ▼
MorseViewModel.doPlay()
    │
    ├─ Get current word from textBuffer[wordIndex]
    │
    ▼
morseWordPlayer.playWord(word, config)
    │
    ├─ [If Speak First enabled]
    │   MorseVoice.speak(word)  ─── Web Speech API ──► 🔊 spoken word
    │   Wait for speak complete
    │
    ▼
morse-pro.encode(word)  ─── text-to-morse mapping ──► "·· - · ··"
    │
    ▼
morseTimingCalculator.calculate(morseString, WPM, FWPM)
    │  PARIS algorithm:
    │  dit = 1200/WPM ms
    │  dah = 3 × dit
    │  inter-element gap = 1 × dit
    │  inter-character gap = 3 × dit (stretched if FWPM < WPM)
    │  word gap = 7 × dit (stretched if FWPM < WPM)
    │
    ▼
TimeLineInfo[] (array of events with absolute ms timestamps)
    e.g. [{type:"dit_start", t:0}, {type:"dit_end", t:60}, ...]
    │
    ▼
Web Audio API scheduling
    │  AudioContext.currentTime + offset → precise scheduling
    │  OscillatorNode.start() / .stop() at each event time
    │  GainNode for volume + envelope (fade in/out to prevent clicks)
    │
    ├─ [If noise enabled]
    │   NoiseGenerator mixed in parallel via separate GainNode
    │
    ▼
🔊 Morse tones played
    │
    ▼
onWordComplete callback → MorseViewModel.incrementIndex()
    │
    ▼
Next word → repeat from playWord()
```

---

## 10. Build Pipeline

The build has **three phases**: Pre-build → Webpack → Post-build.

### Pre-build (runs first, generates code)

```
npm run prebuild
    │
    ├─ prebuildLessons.ts
    │   Scans all files in src/wordfiles/
    │   Generates src/morse/lessons/morseLessonFinder.js
    │   Contains a giant switch/case:
    │     case "BC1_Default": return require("../../wordfiles/BC1_Default.json")
    │     case "Words_10L":   return require("../../wordfiles/Words_10L.txt")
    │     ...
    │
    ├─ prebuildPresets.ts
    │   Scans src/presets/configs/
    │   Generates morsePresetFinder.js (same switch/case pattern)
    │
    └─ prebuildPresetSets.ts
        Scans src/presets/sets/
        Generates morsePresetSetFinder.js
```

**Why?** Webpack needs static `require()` calls — you can't do `require(dynamicVariable)`. The pre-build scripts generate all the static require calls automatically, so adding a new wordlist file just requires re-running the build.

### Webpack Build

```
npm run build
    │
    Entry: src/index.tsx
    │
    Loaders applied:
    ├─ .ts files     → ts-loader → TypeScript compiled to ES2020
    ├─ .js files     → babel-loader → transpiled/polyfilled
    ├─ .css files    → css-loader + MiniCssExtractPlugin → extracted CSS file
    ├─ .html files   → html-loader → inlined into JS bundle
    └─ images        → asset/resource → copied to dist/assets/ with content hash
    │
    Output: dist/
    ├─ index.html           (from template.html, with bundle script tags injected)
    ├─ bundle.[hash].js     (all TypeScript + JavaScript)
    ├─ style.[hash].css     (extracted CSS)
    └─ assets/[hash].png    (images with cache-busting filenames)
```

### Post-build

```
├─ zipdist.ts        → Creates morse.zip from dist/ contents
└─ checklessons.js   → Validates all lesson JSON files have required fields
```

### Full build command:
```bash
npm run build   # runs prebuild + webpack + postbuild automatically
```

---

## 11. UI Structure

The layout is implemented in **React** (see `src/morse/components/app/AppContent.tsx` and related files). `src/template.html` only mounts the app. The following matches the on-screen structure:

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [Logo]  MorseBrowser v1.13    [🌙 Dark Mode]  [Credits] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ LESSON CONTROLS                                         │
│ CLASS: [BC1 ▼]  LESSON: [Recognition ▼]  TYPE: [All ▼] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ SETTINGS (collapsible accordion)                        │
│ ├─ Speed: WPM [12] FWPM [10]                            │
│ ├─ Frequency: Dit [500 Hz] Dah [500 Hz]                 │
│ ├─ Volume: [▐▐▐▐▐░░░░░] 50%                             │
│ ├─ Spacing: Pre-space [2s] Extra word space [1]         │
│ └─ Voice: [Enable] [Voice: ▼] [Rate] [Pitch]            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ TEXT AREA                                               │
│ [Free text input for custom practice]                   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ PLAYBACK CONTROLS                                       │
│ [◄◄ Prev]  [▶ Play]  [⏸ Pause]  [■ Stop]  [►► Next]   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ WORD CARDS                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  the     │ │  and     │ │  for     │                 │
│ │ ▓ ▓ ▓   │ │ ▓░░ ▓ ▓ │ │ ▓░░ ▓░░ │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│ [Shuffle] [Sticky sets ▼]                               │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ ADVANCED PANELS (collapsible)                           │
│ ├─ Noise: [Pink ▼] [Volume] [Enable]                    │
│ ├─ RSS Feeds: [URL input] [Fetch]   (if ?rssEnabled)    │
│ └─ Keyboard Shortcuts reference table                   │
└─────────────────────────────────────────────────────────┘
```

---

## 12. State Persistence

User preferences persist across browser sessions via two mechanisms:

| Mechanism | What's stored |
|-----------|--------------|
| **Cookies (js-cookie)** | WPM, FWPM, frequency, volume, selected class, selected lesson, letter group, voice settings |
| **localStorage** | Dark mode preference (`theme: "dark"` or `"light"`) |

**Cookie naming pattern:** Each setting has a unique key, e.g.:
- `licw_wpm` → current WPM
- `licw_class` → selected class ("BC1")
- `licw_display` → selected lesson display name
- `licw_lettergroup` → selected letter group

**On load:** The ViewModel calls each handler's `.load()` method, which reads the cookie and restores the observable value before the React tree reads initial state via `MorseContext`.

---

## 13. Dark Mode

Implemented with **Bootstrap 5.3 color modes** using `data-bs-theme` on the **document root** (`<html>`), plus custom CSS in `src/css/style.css`.

**How it works:**
1. `data-bs-theme="dark"` enables Bootstrap’s dark palette and fork-specific overrides under `[data-bs-theme="dark"]`
2. A small inline `<script>` in `<head>` of `src/template.html` reads `localStorage` and sets the theme **before** CSS loads, reducing flash of the wrong mode
3. The toggle in `Header.tsx` flips `data-bs-theme`, updates `theme-color` meta, and persists `theme` in `localStorage`
4. Icons and the club logo are inverted in dark mode via CSS (see `style.css`)
5. Additional tweaks cover accordions, tables, and controls as needed

---

## 14. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Enter` | Stop |
| `←` | Previous word |
| `→` | Next word |
| `↑` | Increase WPM |
| `↓` | Decrease WPM |
| `S` | Shuffle words |
| `R` | Repeat current word |

Full reference table is shown in the app's collapsible "Keyboard Shortcuts" accordion.

---

## 15. Admin & Debug Features

Activated via **query parameters**:

| Parameter | Effect |
|-----------|--------|
| `?adminMode=true` | Shows advanced configuration options |
| `?rssEnabled=true` | Shows RSS feed input panel |
| `?noiseEnabled=true` | Shows noise generator controls |
| `?dev=true` | Activates development mode indicators |

**Flagged Words panel:** Internal debug display (collapsible) showing words that encountered errors during playback. Useful for diagnosing word list or encoding issues.

---

## 16. Development Workflow

For a **verbose walkthrough of architecture, the React–ViewModel bridge, lesson cascade, and playback pipeline**, see **[docs/MAINTAINER_GUIDE.md](docs/MAINTAINER_GUIDE.md)**.

### Prerequisites
- Node.js 16+
- npm

### Setup
```bash
git clone https://github.com/LongIslandCW/morsebrowser.git
cd morsebrowser
npm install
```

### Development server (hot reload)
```bash
npm run dev
# Opens http://localhost:3000
```

### Production build
```bash
npm run build
# Output in dist/
```

### Deploy to server (rsync example)
```bash
rsync -avz --delete dist/ user@yourserver.com:/var/www/html/morsebrowser/
```

### Adding a new word list
1. Add your `.txt` or `.json` file to `src/wordfiles/`
2. Add an entry to `src/wordfilesconfigs/wordlists.json`
3. Reference it in the appropriate preset set file under `src/presets/sets/`
4. Run `npm run build` — the pre-build scripts pick it up automatically

### Adding a new lesson class
1. Add the class name to `src/presets/config.json`
2. Create `src/presets/sets/NEWCLASS.json` with the lesson list
3. Create word list files as needed
4. Run `npm run build`

---

## 17. Deployment

**Live site:** https://longislandcw.github.io/morsebrowser/
**GitHub repo:** https://github.com/LongIslandCW/morsebrowser/

The app is **entirely static** — just HTML, CSS, and JS files. No server-side code.

**DigitalOcean server deployment** (this fork):
- Nginx serves the `dist/` directory
- Let's Encrypt TLS certificate via `certbot` — auto-renews via `certbot.timer` systemd service (runs twice daily)
- Deploy via rsync (see Development Workflow above)

---

## 18. Fork Changes vs Upstream

This repository is a fork of the upstream LICW repo. Changes made in this fork:

### Lesson Bug Fixes (`src/morse/lessons/morseLessonPlugin.ts`)
- **Removed `displaysInitialized = false`** from inside the `displays` computed. This caused a permanent lock-out after class switches because `childrenComplete` (the only restorer) doesn't fire on same-length array transitions.
- **`displays` returns dummy item** instead of `[]` when no wordlist matches, preventing an empty lesson dropdown from leaving `selectedDisplay` `undefined`.
- **Null guards** added in `applyOverrides` and `setPresetSelected` for `selectedDisplay()`.
- **Auto-select** when exactly one lesson is available (in `setDisplaysInitialized` else-branch and `setLetterGroup`).

### TYPE Select Fix
- **Upstream / Knockout era:** `src/template.html` used a Knockout `change` handler on TYPE to call `lessons.changeUserTarget`.
- **This fork (React):** `src/morse/components/app/LessonsAccordion.tsx` wires the TYPE `<select>` with `onChange` → `vm.lessons.changeUserTarget(...)`.

### Dark Mode (`src/css/style.css`, `src/template.html`, React header)
- Dark mode via `data-bs-theme` on `<html>` and CSS under `[data-bs-theme="dark"]`
- No-flash script in `<head>` applies saved theme before CSS loads
- Toggle in `Header.tsx` with `localStorage` and `theme-color` meta updates
- Image inversion and component tweaks as in `style.css`

### UI layout (React)
- Settings, working text, playback controls, and accordions live in React components (`src/morse/components/`) with Bootstrap layout classes
- Google Analytics and Google Tag Manager scripts removed from the template

### Logo Responsive Sizing (`src/css/style.css`)
- Logo scales: 120px on mobile, 200px on screens ≥576px

---

## 19. Glossary

| Term | Definition |
|------|-----------|
| **CW** | Continuous Wave — the radio mode used for Morse code |
| **WPM** | Words Per Minute — Morse code speed |
| **FWPM** | Farnsworth WPM — overall speed when character speed and word speed differ |
| **PARIS** | Standard word used to define Morse timing (50 units = 1 word) |
| **Dit** | A short Morse element (dot) |
| **Dah** | A long Morse element (dash) — exactly 3× the dit duration |
| **Prosign** | A procedural signal in CW, e.g. `<AR>` (end of message), `<SK>` (end of work) |
| **Koch method** | A training method: learn characters at full speed, add one at a time |
| **BC1/BC2/BC3** | Beginner Classes 1, 2, 3 — progressive letter introduction |
| **INT** | Intermediate — word/phrase practice |
| **ADV** | Advanced — full QSO and high-speed practice |
| **TTR** | Two-Tone Recognition — a specific practice modality |
| **VET** | Variable Element Timing — a practice modality |
| **QSO** | Ham radio contact / conversation |
| **LICW** | Long Island CW Club |
| **MVVM** | Model-View-ViewModel — separation between ViewModel (`MorseViewModel`) and React view |
| **Observable** | A reactive value in `src/morse/utils/observable.ts`; `MorseContext` syncs to React |
| **Computed** | Derived observable that re-evaluates when listed dependencies change |
| **Sticky sets** | Word groups that remain fixed (not shuffled) between sessions |
| **Wordify** | The process of expanding abbreviations before text-to-speech |
| **PreSpace** | Silence before playback starts (helps prepare the listener) |

---

*Documentation updated for React UI + ViewModel bridge. For fork-specific changes, see [CLAUDE.md](CLAUDE.md).*
