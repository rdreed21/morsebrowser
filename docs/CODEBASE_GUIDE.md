# MorseBrowser Codebase Guide

A file-by-file walkthrough of the MorseBrowser project for JavaScript/TypeScript learners.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [How to Run It](#how-to-run-it)
3. [Project Layout at a Glance](#project-layout-at-a-glance)
4. [The Build Pipeline](#the-build-pipeline)
5. [Entry Point: How the App Starts](#entry-point-how-the-app-starts)
6. [The Observable System (Custom Reactivity)](#the-observable-system)
7. [MorseViewModel: The Brain](#morseviewmodel-the-brain)
8. [MorseContext: Bridging to React](#morsecontext-bridging-to-react)
9. [React Components: The UI Layer](#react-components-the-ui-layer)
10. [Lessons System: How Practice Content Loads](#lessons-system)
11. [Play Flow: From Button Click to Sound](#play-flow)
12. [Audio System: How Morse Becomes Sound](#audio-system)
13. [Settings and Persistence](#settings-and-persistence)
14. [Text-to-Speech (Voice)](#text-to-speech)
15. [The morse-pro Library](#the-morse-pro-library)
16. [Lesson Data Files](#lesson-data-files)
17. [Preset System](#preset-system)
18. [Build Scripts (Prebuild, Postbuild)](#build-scripts)
19. [Config Files Reference](#config-files-reference)
20. [Testing](#testing)
21. [Key Concepts for JS Learners](#key-concepts-for-js-learners)

---

## What This App Does

MorseBrowser is a Morse code practice tool. Users pick a class (like "BC1" for Beginner Class 1), choose a lesson, and hit Play. The app:

1. Loads a word list for that lesson
2. Converts each word to Morse code (dots and dashes)
3. Generates audio tones and plays them through the browser
4. Shows word cards on screen that reveal after playing
5. Optionally speaks the words aloud using text-to-speech

Everything runs in the browser — there is no server or database. Settings are saved in browser cookies.

---

## How to Run It

```bash
npm install        # Install dependencies (once)
npm run dev        # Start dev server at http://localhost:3000
npm test           # Run 88 automated tests
npm run build      # Production build to dist/
```

---

## Project Layout at a Glance

```
morsebrowser/
│
├── src/                          # All application source code
│   ├── index.tsx                 # Entry point — creates ViewModel, mounts React
│   ├── App.tsx                   # Root React component
│   ├── template.html             # HTML shell (Webpack injects scripts into this)
│   │
│   ├── css/
│   │   └── style.css             # All custom styles (dark mode, layout, etc.)
│   │
│   ├── assets/
│   │   └── CW-Club-logo-*.png    # LICW logo image
│   │
│   ├── morse/                    # Core application logic + React components
│   │   ├── morse.ts              # MorseViewModel — the central "brain"
│   │   ├── context/              # React context that bridges ViewModel → React
│   │   ├── components/           # All React UI components
│   │   ├── lessons/              # Lesson loading and dropdown logic
│   │   ├── player/               # Audio playback engine
│   │   ├── settings/             # WPM, frequency, misc settings
│   │   ├── timing/               # Morse timing math (WPM → milliseconds)
│   │   ├── voice/                # Text-to-speech integration
│   │   ├── utils/                # Observables, string parsing, helpers
│   │   ├── cookies/              # Cookie read/write for settings persistence
│   │   ├── flaggedWords/         # Flagged word tracking
│   │   ├── rss/                  # RSS feed experiment (not active in UI)
│   │   ├── images/               # Icon/image URL registry
│   │   └── shortcutKeys/         # Keyboard shortcut registration
│   │
│   ├── morse-pro/                # Morse encoding/decoding/audio library (3rd party)
│   ├── easyspeech/               # Text-to-speech library helper
│   ├── wordfiles/                # 631 lesson data files (.txt and .json)
│   ├── wordfilesconfigs/
│   │   └── wordlists.json        # Master index linking lessons to word files
│   └── presets/                  # Saved setting configurations
│       ├── config.json           # Maps classes to preset sets
│       ├── sets/                 # 11 preset set files (list of presets per class)
│       ├── configs/              # 212 individual preset config files
│       ├── overrides/            # Preset override data
│       └── legacymixin/          # Legacy compatibility data
│
├── webpack.config.js             # Build configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test runner configuration
├── package.json                  # Dependencies and npm scripts
├── prebuildLessons.ts            # Generates lesson finder from word files
├── prebuildPresetSets.ts         # Generates preset set finder
├── prebuildPresets.ts            # Generates preset config finder
├── zipdist.ts                    # Zips dist/ for download
└── checklessons.js               # Validates lesson data consistency
```

---

## The Build Pipeline

Understanding the build pipeline helps you see how source files become a running app.

### What Webpack Does

**Webpack** (`webpack.config.js`) is a bundler. It takes all your source files and combines them into a small number of output files the browser can load efficiently.

```
src/index.tsx ──→ Webpack ──→ dist/bundle[hash].js    (all JS/TS)
                           ──→ dist/bundle[hash].css   (all CSS)
                           ──→ dist/index.html         (from template.html)
```

Key things the Webpack config does:

| Config section | What it does | Why it matters |
|---|---|---|
| `entry` | Starts from `src/index.tsx` | Webpack follows all `import` statements from here |
| `output` | Writes to `dist/` with content hashes | Hash in filename busts browser caches |
| `devServer` | Runs on port 3000 with hot reload | Changes appear instantly during development |
| `module.rules` | How to process different file types | `.css` → CSS loader, `.tsx` → TypeScript loader, `.txt` → raw text import, `.js` → Babel |
| `resolve.fallback` | Polyfills for Node.js APIs | The RSS library needs `stream`, `http`, etc. which don't exist in browsers |
| `plugins` | Extra processing steps | HTML generation, CSS extraction, ESLint checking, tree-shaking unused CSS |

### The Prebuild Step

Before Webpack runs, three TypeScript scripts generate "finder" files:

```
prebuildLessons.ts    → src/morse/morseLessonFinder.js
prebuildPresetSets.ts → src/morse/morsePresetSetFinder.js
prebuildPresets.ts    → src/morse/morsePresetFinder.js
```

These scripts scan the `wordfiles/` and `presets/` directories and generate JavaScript `switch` statements with dynamic `import()` calls for each file. This is how the app knows about all available lessons and presets at build time without hardcoding them.

**Example of what gets generated** (simplified):

```javascript
// morseLessonFinder.js (auto-generated)
export function getMorseLessonFile(name) {
  switch (name) {
    case 'wordfiles/B1.json':
      return import('../wordfiles/B1.json')
    case 'wordfiles/BC1_REA.txt':
      return import('../wordfiles/BC1_REA.txt')
    // ... hundreds more cases
  }
}
```

---

## Entry Point: How the App Starts

Follow the code from the very first line that runs:

### Step 1: `src/template.html`

This is the HTML skeleton. Webpack injects the bundled JS and CSS into it. Key parts:

- A `<script>` in `<head>` reads saved theme from `localStorage` and sets `data-bs-theme` before CSS loads (prevents flash of wrong theme)
- `<div id="app-loading">` shows a spinner while JS loads
- `<div id="react-root">` is where React will mount

### Step 2: `src/index.tsx`

This is the JavaScript entry point. Here is what happens in order:

```
1. Import Bootstrap CSS and JS plugins
2. Import custom styles (style.css)
3. Import MorseViewModel and React
4. const vm = new MorseViewModel()     ← Creates ALL app state
5. Remove the loading spinner
6. Mount <App vm={vm} /> into #react-root
```

**Key insight**: The `MorseViewModel` is created *before* React mounts. React is just the display layer — the ViewModel owns all the logic.

### Step 3: `src/App.tsx`

Very simple — wraps everything in the context provider:

```tsx
function App({ vm }) {
  return (
    <MorseProvider vm={vm}>
      <AppContent />
    </MorseProvider>
  )
}
```

### Step 4: React renders the UI

`AppContent` renders the full page (header, settings, lessons, controls, word list, etc.).

---

## The Observable System

**File:** `src/morse/utils/observable.ts`

This is one of the most important files to understand. The app uses a custom reactivity system inspired by Knockout.js (an older framework). This is how the app tracks changes to state and updates the UI.

### What is an Observable?

An observable is a value that notifies listeners when it changes. Think of it like a variable with superpowers:

```typescript
import { observable } from './observable'

// Create an observable with initial value 12
const speed = observable(12)

// READ the value (call with no arguments)
console.log(speed())  // → 12

// WRITE a new value (call with one argument)
speed(15)
console.log(speed())  // → 15

// SUBSCRIBE to changes
const subscription = speed.subscribe((newValue) => {
  console.log('Speed changed to', newValue)
})

speed(20)  // Console prints: "Speed changed to 20"

// Stop listening
subscription.dispose()
```

### Computed Observables

A computed observable derives its value from other observables. It auto-updates when its dependencies change:

```typescript
const wpm = observable(15)
const fwpm = observable(10)

// This recomputes whenever wpm or fwpm changes
const isFarnsworth = computed(
  () => fwpm() < wpm(),
  [wpm, fwpm]
)

console.log(isFarnsworth())  // → true (10 < 15)
wpm(8)
console.log(isFarnsworth())  // → false (10 < 8 is false)
```

### Observable Arrays

Like observables but for arrays, with extra methods:

```typescript
const words = observableArray(['hello', 'world'])
words.push('morse')        // Notifies subscribers
words.remove('world')      // Notifies subscribers
console.log(words())       // → ['hello', 'morse']
```

### Why This Matters

Almost every piece of state in the app is an observable. When you see `this.volume = observable(10)` in the ViewModel, that means:
- React context subscribes to `volume` and re-renders when it changes
- Cookie saving subscribes to `volume` and saves when it changes
- The audio player reads `volume()` when building playback config

---

## MorseViewModel: The Brain

**File:** `src/morse/morse.ts`

This is the largest and most important file. It is the central hub that connects everything together. Think of it as the "controller" that coordinates all the pieces.

### What It Owns

| Category | Examples | What they do |
|---|---|---|
| **Text** | `rawText`, `showingText`, `showRaw` | The practice text that gets converted to Morse |
| **Playback** | `playerPlaying`, `isPaused`, `currentIndex` | Whether audio is playing and which word we're on |
| **Audio config** | `volume`, `smoothing`, rise/decay times | How the Morse tones sound |
| **Subsystems** | `settings`, `lessons`, `morseVoice`, `morseWordPlayer` | Delegated logic for specific domains |
| **UI state** | `hideList`, `showExpert`, `currentCardIndex` | What's visible on screen |
| **Persistence** | `allowSaveCookies` | Whether to save settings to cookies |

### Key Methods

| Method | What it does |
|---|---|
| `doPlay(isPaused, fromButton)` | Starts or resumes Morse playback |
| `doPause()` | Pauses playback |
| `setText(text)` | Sets new practice text (called by lessons) |
| `shuffleWords(preserveIndex)` | Randomizes the word order |
| `getMorseStringToWavBufferConfig(word)` | Builds the config object that tells the audio system what to play |

### How Subsystems Connect

```
MorseViewModel
  ├── MorseSettings (speed, frequency, misc)
  │     ├── SpeedSettings (WPM, FWPM)
  │     ├── FrequencySettings (tone Hz)
  │     └── MiscSettings (newline chunking, etc.)
  ├── MorseLessonPlugin (lesson dropdowns, word loading)
  ├── MorseWordPlayer (audio playback)
  │     ├── SmoothedSoundsPlayer (oscillator-based)
  │     └── MorseWavBufferPlayer (WAV buffer-based)
  ├── MorseVoice (text-to-speech)
  ├── FlaggedWords (words the user marked)
  ├── CardBufferManager (word card navigation)
  ├── MorseCookies (save/load settings)
  └── MorseShortcutKeys (keyboard shortcuts)
```

---

## MorseContext: Bridging to React

**File:** `src/morse/context/MorseContext.tsx`

This is the bridge between the observable-based ViewModel and React's rendering system.

### The Problem It Solves

React re-renders components when their state changes. The ViewModel uses observables (not React state). MorseContext subscribes to all the observables and copies their values into React state, triggering re-renders when anything changes.

### How It Works

1. **`snapshot(vm)`** — Reads every observable once and returns a plain JavaScript object with all current values
2. **`useKOBridge(vm)`** — A React hook that:
   - Creates initial state from `snapshot(vm)`
   - Subscribes to every observable
   - When any observable changes, re-runs `snapshot(vm)` and updates React state
3. **`MorseProvider`** — Wraps the app and provides context
4. **`useMorse()`** — Hook that components use to access all app state

### Usage in Components

```tsx
function MyComponent() {
  const morse = useMorse()

  // Read values
  const speed = morse.speed.wpm
  const isPlaying = morse.playerPlaying

  // Write values (go through the ViewModel)
  const handleVolumeChange = () => {
    morse.vm.volume(5)
  }
}
```

**Key rule**: Reading goes through context. Writing goes through `morse.vm` (the ViewModel).

---

## React Components: The UI Layer

**Directory:** `src/morse/components/`

All visible UI lives here. Components read state from `useMorse()` and call ViewModel methods for actions.

### Component Tree

```
App
 └── MorseProvider
      └── AppContent                    ← Main layout
           ├── Header                   ← Logo, title, dark mode toggle
           ├── BasicSettings            ← WPM, FWPM, volume controls
           ├── WorkingText              ← Text area, preview, timer
           ├── LessonsAccordion         ← TYPE/CLASS/LESSON dropdowns
           ├── MoreSettingsAccordion    ← Advanced settings
           ├── FlaggedWordsAccordion    ← Flagged words list
           ├── Controls                 ← Play/Pause/Stop buttons
           ├── WordList                 ← Word cards grid
           └── KeyboardShortcuts       ← Shortcut key table
```

### File-by-File

| File | What It Renders | Key Interactions |
|---|---|---|
| `app/AppContent.tsx` | The full page layout using Bootstrap grid | Composes all other components |
| `app/Header.tsx` | Logo, title, dark mode toggle, credits | `localStorage` for theme; `vm.logoClick()` |
| `app/BasicSettings.tsx` | Speed and volume number inputs | `vm.settings.speed.wpm()`, `vm.volume()` |
| `app/WorkingText.tsx` | Text area with edit/preview toggle | `vm.rawText()`, `vm.showingText()`, file upload |
| `app/LessonsAccordion.tsx` | Cascading dropdown selects (TYPE → CLASS → LETTER GROUP → LESSON → PRESET) | `vm.lessons.changeSelectedClass()`, `vm.lessons.setDisplaySelected()` |
| `app/MoreSettingsAccordion.tsx` | Tone frequency, spacing, card display, voice settings | Various `vm.settings.*` and `vm.morseVoice.*` |
| `app/Controls.tsx` | Play/Pause/Stop, Reveal, Shuffle, Loop buttons | `vm.doPlay()`, `vm.doPause()`, `vm.shuffleWords()` |
| `app/WordList.tsx` | Grid of word-card buttons | Click to flag, double-click to jump to word |
| `app/KeyboardShortcuts.tsx` | Table of keyboard shortcuts in a `<details>` element | Reads from `vm.allShortcutKeys()` |
| `flaggedWordsAccordion/FlaggedWordsAccordion.tsx` | Flagged words panel with load/clear | `vm.flaggedWords.*` |
| `morseImage/SimpleImage.tsx` | Small helper to render an icon image | Uses `morseLoadImages` registry |

### How a Component Works (Example: Controls.tsx)

```tsx
function Controls() {
  const morse = useMorse()

  return (
    <div>
      <button onClick={() => morse.vm.doPlay(false, true)}>
        Play
      </button>
      <button onClick={() => morse.vm.doPause()}>
        Pause
      </button>
      {/* ... more buttons */}
    </div>
  )
}
```

Pattern: Read state from `useMorse()` → Render based on state → Call `vm.*` methods on user action.

---

## Lessons System

**Files:**
- `src/morse/lessons/morseLessonPlugin.ts` — Main lesson logic
- `src/morse/lessons/FileOptionsInfo.ts` — Type definitions
- `src/wordfilesconfigs/wordlists.json` — Master lesson index
- `src/morse/morseLessonFinder.js` — Auto-generated file loader

### How the Dropdowns Cascade

The lesson UI has 5 cascading dropdowns. Each one filters the next:

```
TYPE (Student/Instructor/Admin)
  → CLASS (BC1, BC2, INT1, ADV1, ...)
    → LETTER GROUP (REA, KMY, ...)
      → LESSON (specific lesson name)
        → PRESET (speed/settings configuration)
```

### How It Works Internally

1. **`wordlists.json`** contains every lesson as a row with `userTarget`, `class`, `letterGroup`, `display`, and `fileName`
2. **Computed observables** in `morseLessonPlugin.ts` filter this list:
   - `userTargets` = distinct TYPE values
   - `classes` = filtered by selected TYPE
   - `letterGroups` = filtered by TYPE + CLASS
   - `displays` = filtered by TYPE + CLASS + LETTER GROUP
3. When a user selects a LESSON, `setDisplaySelected()` calls `getWordList(fileName)`
4. `getWordList()` uses the auto-generated `morseLessonFinder.js` to dynamically import the file
5. `.txt` files → text is set directly via `setText()`
6. `.json` files → parameters are used to generate random practice text

### What `wordlists.json` Looks Like

```json
[
  {
    "sort": 100,
    "userTarget": "STUDENT",
    "class": "BC1",
    "letterGroup": "REA",
    "display": "REA",
    "fileName": "wordfiles/BC1_REA.txt",
    "newlineChunking": false
  }
]
```

---

## Play Flow

What happens when you click the green **Play** button:

```
1. User clicks Play
   └── Controls.tsx: onClick → vm.doPlay(false, true)

2. MorseViewModel.doPlay()
   ├── Sets playerPlaying = true
   ├── Resets timers and counters
   ├── Gets next word from CardBufferManager
   └── Builds SoundMakerConfig via getMorseStringToWavBufferConfig()

3. MorseWordPlayer.play(config, callback)
   ├── Routes to SmoothedSoundsPlayer OR MorseWavBufferPlayer
   ├── SmoothedSoundsPlayer: builds oscillator timeline from Morse
   └── MorseWavBufferPlayer: generates WAV buffer, decodes, plays

4. Audio plays through Web Audio API
   └── Browser outputs Morse tones through speakers

5. When word finishes → playEnded callback
   ├── Advances currentIndex
   ├── Reveals word card (if configured)
   ├── Optionally speaks word via TTS
   ├── Applies card spacing delay
   └── Calls doPlay() again for next word (loop)

6. When all words done
   ├── If loop mode → shuffle and restart
   └── Otherwise → stop, set playerPlaying = false
```

---

## Audio System

**Directory:** `src/morse/player/`

The app has two ways to generate audio, selectable via the "smoothing" setting:

### Path 1: WAV Buffer Player (`wav/` + `WavBufferPlayer/`)

1. `MorseStringToWavBuffer` takes a word and config (WPM, frequency, etc.)
2. Uses `morse-pro-cw-wave.js` to calculate sample data
3. Builds a WAV file in memory (using RIFF format)
4. Decodes the WAV into an `AudioBuffer` using Web Audio API
5. Plays via `AudioBufferSourceNode`

### Path 2: Smoothed Sounds Player (`SmoothedSounds/`)

1. `MorseStringToWavBuffer` calculates a timeline (when each dit/dah starts and stops)
2. Creates Web Audio `OscillatorNode` (generates the tone)
3. Uses `GainNode` to shape the tone (smooth rise/fall to avoid clicks)
4. Schedules gain changes at precise times matching the timeline

### Key Files

| File | Purpose |
|---|---|
| `morseWordPlayer.ts` | Orchestrates playback, picks which sound maker to use |
| `soundmakers/ISoundMaker.ts` | Interface both players implement |
| `soundmakers/SoundMakerConfig.ts` | Config object (word, WPM, frequencies, etc.) |
| `soundmakers/SmoothedSounds/SmoothedSoundsPlayer.ts` | Oscillator-based playback |
| `soundmakers/SmoothedSounds/SmoothedSoundsContext.ts` | AudioContext setup for smoothed path |
| `soundmakers/WavBufferPlayer/morseWavBufferPlayer.ts` | WAV buffer-based playback |
| `wav/morseStringToWavBuffer.ts` | Converts Morse string to WAV data or timeline |
| `wav/CreatedWav.ts` | Helper types for WAV creation |

### Timing Math

**Directory:** `src/morse/timing/`

| File | What It Calculates |
|---|---|
| `UnitTimingsAndMultipliers.ts` | Basic unit: 1 dit = 1200/WPM milliseconds. Multipliers for dah (3x), inter-element space (1x), inter-character (3x), inter-word (7x) |
| `ComputedTimes.ts` | Total play time for a word, including Farnsworth stretching (slower spacing at lower effective WPM) |
| `MorseCountUnits.ts` | Counts dits and dahs in a Morse pattern |
| `morseTimingCalculator.ts` | Bridges to morse-pro for sample-level timing |

---

## Settings and Persistence

**Directory:** `src/morse/settings/`

### File Breakdown

| File | What It Manages |
|---|---|
| `settings.ts` | Groups speed + frequency + misc into one `MorseSettings` object |
| `speedSettings.ts` | WPM (character speed) and FWPM (effective/Farnsworth speed), sync lock, variable speed |
| `frequencySettings.ts` | Dit frequency (Hz), dah frequency (Hz), sync toggle |
| `miscSettings.ts` | Miscellaneous toggles like newline chunking |
| `settingsOption.ts` | Generic setting primitive (observable + metadata) |
| `morseSettingsHandler.ts` | Applies preset JSON files onto the ViewModel |
| `savedSettingsInfo.ts` | Shape of exported/imported settings files |

### How Settings Are Saved

**Directory:** `src/morse/cookies/`

Settings persist in browser cookies using the `js-cookie` library:

1. In the ViewModel constructor, `saveCookie(observable, key)` subscribes to many observables
2. Whenever a subscribed observable changes, the new value is written to a cookie
3. On page load, `MorseCookies.loadCookiesOrDefaults()` reads cookies and restores values
4. When loading a preset, cookies are temporarily disabled to avoid saving intermediate states

---

## Text-to-Speech

**Directory:** `src/morse/voice/`

| File | Purpose |
|---|---|
| `MorseVoice.ts` | Main voice controller — initializes EasySpeech, manages speak queue, timing relative to Morse playback |
| `MorseVoiceInfo.ts` | Observable state for voice settings (enabled, volume, rate, pitch, voice name) |
| `VoiceBufferInfo.ts` | Buffer tracking for pre-loading speech ahead of playback |

The voice system can speak words before or after the Morse plays (configurable). It uses the browser's built-in `SpeechSynthesis` API via the `easy-speech` library wrapper.

---

## The morse-pro Library

**Directory:** `src/morse-pro/`

This is a modified version of [Stephen C. Phillips' morse-pro library](https://morsecode.world/international/trainer/generator.html). It handles the low-level Morse code operations.

| File | What It Does |
|---|---|
| `morse-pro.js` | **Core**: text ↔ Morse conversion. `text2morse('HELLO')` → `.... . .-.. .-.. ---`. Prosign table, dit/dah notation. |
| `morse-pro-wpm.js` | WPM calculation helpers |
| `morse-pro-message.js` | Message structure/sequencing |
| `morse-pro-cw.js` | CW timing composition |
| `morse-pro-cw-wave.js` | **Key file**: Generates audio waveform samples from Morse patterns. Used by both audio paths. |
| `morse-pro-player-waa.js` | Web Audio API player implementation |
| `morse-pro-player-waa-light.js` | Lighter player variant |
| `morse-pro-player-xas.js` | Alternative player backend |
| `morse-pro-decoder.js` | Decode Morse timing back to text |
| `morse-pro-decoder-adaptive.js` | Adaptive decoder variant |
| `morse-pro-listener.js` | Audio listening/decoding pipeline |
| `morse-pro-listener-adaptive.js` | Adaptive listener variant |
| `morse-pro-keyer.js` | Morse keyer logic |
| `morse-pro-keyer-iambic.js` | Iambic paddle keyer |
| `morse-pro-util-riffwave.js` | Creates WAV file bytes (RIFF format) |
| `morse-pro-util-datauri.js` | Data URI helpers for audio |
| `morse-pro.test.ts` | Tests for the core encoding/decoding |

**Note:** Not all files are actively used by this app. The main ones used are `morse-pro.js` (encoding), `morse-pro-cw-wave.js` (waveform generation), and `morse-pro-util-riffwave.js` (WAV packaging).

---

## Lesson Data Files

### Word Files (`src/wordfiles/`)

631 files containing practice content:

- **`.txt` files** (397): Plain text word lists, one word or phrase per line
  ```
  HELLO
  WORLD
  MORSE
  CODE
  ```
- **`.json` files** (234): Generator configurations or structured lesson data
  ```json
  {
    "letters": "KMYREA",
    "minWordSize": 3,
    "maxWordSize": 5,
    "practiceSeconds": 120
  }
  ```

### Naming Conventions

| Prefix | Meaning |
|---|---|
| `BC1_`, `BC2_`, `BC3_` | Beginner Classes 1-3 |
| `INT*` | Intermediate |
| `ADV*` | Advanced |
| `IB*` | Intermediate Beginner |
| `SB*` | Skills Builder |
| `ICR*` | ICR series |
| `POL_*` | Polish series |
| `Fam_*` | Familiarity exercises |
| `Bug_*` | Bug (straight key) practice |

### Master Index (`src/wordfilesconfigs/wordlists.json`)

This JSON file maps every lesson to its word file. Each entry has:
- `userTarget` — who sees it (STUDENT, INSTRUCTOR, ADMIN)
- `class` — which class (BC1, BC2, INT1, etc.)
- `letterGroup` — letter subset (REA, KMY, etc.)
- `display` — human-readable name shown in dropdown
- `fileName` — path to the actual word file
- `sort` — ordering in the dropdown

---

## Preset System

**Directory:** `src/presets/`

Presets save and restore collections of settings (speed, spacing, card display, etc.).

### How Presets Are Organized

```
presets/
├── config.json              # Maps each class to a default preset set
├── sets/
│   ├── bc1.json             # Lists available presets for BC1
│   ├── bc2.json             # Lists available presets for BC2
│   └── ...                  # 11 set files total
├── configs/
│   ├── bc1_default_12_8.json    # Actual preset values (WPM=12, FWPM=8)
│   ├── bc2_default_12_10.json
│   └── ...                      # 212 config files total
├── overrides/
│   └── presetoverrides.json     # Override rules
└── legacymixin/
    └── legacymixin.json         # Legacy compatibility
```

### Flow

1. User selects a CLASS → `config.json` says which preset set file to load
2. Preset set file (e.g. `sets/bc1.json`) lists available presets for that class
3. User picks a preset → the config file (e.g. `configs/bc1_default_12_8.json`) is loaded
4. Config file contains key-value pairs that map to ViewModel settings
5. `MorseSettingsHandler` applies those values to the ViewModel

---

## Build Scripts

### Prebuild (runs before `npm run build`)

| Script | Reads | Writes | Purpose |
|---|---|---|---|
| `prebuildLessons.ts` | `src/wordfiles/*.{txt,json}` | `src/morse/morseLessonFinder.js` | Generates switch/case for dynamic lesson imports |
| `prebuildPresetSets.ts` | `src/presets/sets/*.json` | `src/morse/morsePresetSetFinder.js` | Generates switch/case for preset set imports |
| `prebuildPresets.ts` | `src/presets/configs/*.json` | `src/morse/morsePresetFinder.js` | Generates switch/case for preset config imports |

Each script works the same way:
1. Read a template file (e.g. `morseLessonFinderTemplate.js`)
2. Scan a directory for data files
3. Generate a `case` statement for each file with a dynamic `import()` call
4. Write the completed finder file

### Postbuild (runs after `npm run build`)

| Script | Purpose |
|---|---|
| `zipdist.ts` | Zips `dist/` into `dist/download/morse.zip` for offline download |
| `checklessons.js` | Validates that `wordlists.json` entries match actual files in `wordfiles/` |

---

## Config Files Reference

| File | Purpose |
|---|---|
| `webpack.config.js` | Bundler configuration (entry, output, loaders, plugins, dev server) |
| `tsconfig.json` | TypeScript compiler settings for application code |
| `tsconfig.node.json` | TypeScript settings for build scripts (CommonJS, Node types) |
| `tsconfig.test.json` | TypeScript settings for test files |
| `vitest.config.ts` | Test runner configuration |
| `.eslintrc.json` | Linting rules (standard + TypeScript) |
| `.eslintignore` | Files excluded from linting (`node_modules`, `morse-pro`) |
| `.babelrc` | Babel config for non-TypeScript JS files |
| `package.json` | Dependencies and npm scripts |

---

## Testing

**Config:** `vitest.config.ts`

The project uses [Vitest](https://vitest.dev/) for unit testing. Test files live next to the code they test with a `.test.ts` suffix.

| Test File | What It Tests |
|---|---|
| `src/morse-pro/morse-pro.test.ts` | Morse encoding/decoding (A→.-, prosigns, etc.) |
| `src/morse/timing/UnitTimingsAndMultipliers.test.ts` | WPM → milliseconds math |
| `src/morse/timing/ComputedTimes.test.ts` | Full timing calculations with Farnsworth |
| `src/morse/utils/morseStringUtils.test.ts` | Text processing (replacements, punctuation, word splitting) |
| `src/morse/utils/wordInfo.test.ts` | Word parsing with display/speech/group overrides |

See the Testing section in `CLAUDE.md` for a detailed tutorial on writing tests.

---

## Key Concepts for JS Learners

### 1. TypeScript (`.ts` and `.tsx` files)

TypeScript is JavaScript with type annotations. The `: string` and `: number` parts tell the compiler what type each variable should be:

```typescript
function add(a: number, b: number): number {
  return a + b
}
```

`.tsx` files are TypeScript files that also contain JSX (React's HTML-like syntax).

### 2. ES Modules (`import` / `export`)

Files share code using `import` and `export`:

```typescript
// In observable.ts
export function observable(value) { ... }

// In morse.ts
import { observable } from './utils/observable'
```

### 3. React Components

React components are functions that return JSX (HTML-like syntax):

```tsx
function Header() {
  return <h1>Morse Practice Page</h1>
}
```

### 4. React Context

Context lets deeply nested components access shared state without passing props through every level:

```tsx
// Provider wraps the tree
<MorseProvider vm={vm}>
  <AppContent />      {/* All children can use useMorse() */}
</MorseProvider>

// Any child component
function Controls() {
  const morse = useMorse()  // Gets the shared state
}
```

### 5. Dynamic `import()`

Used in the lesson finder files to load lesson data on demand (not all at once):

```javascript
// Only loads this file when the user actually picks this lesson
const data = await import('../wordfiles/BC1_REA.txt')
```

### 6. Web Audio API

The browser API for generating and playing sounds. Key concepts used in this app:
- `AudioContext` — the main audio system
- `OscillatorNode` — generates a tone at a specific frequency
- `GainNode` — controls volume (used for smooth rise/fall of tones)
- `AudioBufferSourceNode` — plays pre-computed audio data

### 7. Observer Pattern

The observable system is an implementation of the Observer Pattern: objects (observables) maintain a list of dependents (subscribers) and notify them of state changes. This is the foundation of reactive programming.

---

## Suggested Reading Order

If you want to understand the codebase from scratch, read files in this order:

1. **`src/morse/utils/observable.ts`** — Understand the reactivity system first
2. **`src/index.tsx`** — See how the app boots
3. **`src/App.tsx`** — See the React root
4. **`src/morse/context/MorseContext.tsx`** — See how observables connect to React
5. **`src/morse/components/app/AppContent.tsx`** — See the page layout
6. **`src/morse/components/app/Controls.tsx`** — See how user actions trigger ViewModel methods
7. **`src/morse/morse.ts`** — The main ViewModel (skim first, deep-dive later)
8. **`src/morse/timing/UnitTimingsAndMultipliers.ts`** — Clean, self-contained math
9. **`src/morse-pro/morse-pro.js`** — How text becomes dots and dashes
10. **`src/morse/player/morseWordPlayer.ts`** — How Morse becomes sound
11. **`src/morse/lessons/morseLessonPlugin.ts`** — How lessons load
12. **`webpack.config.js`** — How it all gets bundled

---

*This guide was generated for the MorseBrowser fork. For upstream documentation, see the [original repository](https://github.com/LongIslandCW/morsebrowser).*
