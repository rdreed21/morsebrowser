/**
 * MorseContext — React state bridge over MorseViewModel.
 *
 * Strategy (strangler-fig migration):
 *   • MorseViewModel continues to own all business logic and uses custom
 *     observables (src/morse/utils/observable.ts), not the Knockout library.
 *   • This context subscribes to the observables React components need and
 *     mirrors their values into React state so components re-render when
 *     the model changes.
 *   • Writers should still use the ViewModel's observable setters (e.g.
 *     morse.vm.volume(5)) so the VM stays the single source of truth until
 *     any later phase that removes the bridge entirely.
 *
 * Usage:
 *   const morse = useMorse()
 *   // read:  morse.volume
 *   // write: morse.vm.volume(5)   ← observable setter; subscribers + React re-render
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { MorseViewModel } from '../morse'
import WordInfo from '../utils/wordInfo'
import { PlayingTimeInfo } from '../utils/playingTimeInfo'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpeedState {
  wpm: number
  fwpm: number
  syncWpm: boolean
  speedInterval: boolean
  intervalTimingsText: string
  intervalWpmText: string
  intervalFwpmText: string
  vWpm: number
  vFwpm: number
  variableSpeedDisplay: boolean
  trueWpm: number
}

export interface MiscState {
  newlineChunking: boolean
}

export interface FrequencyState {
  ditFrequency: number
  dahFrequency: number
  syncFreq: boolean
}

export interface LessonState {
  userTarget: string
  selectedClass: string
  letterGroup: string
  selectedDisplay: any
  userTargets: any[]
  classes: any[]
  letterGroups: any[]
  displays: any[]
  customGroup: string
  randomizeLessons: boolean
  autoCloseLessonAccordion: boolean
  ifStickySets: boolean
  stickySets: string
  ifOverrideTime: boolean
  overrideMins: number
  ifOverrideMinMax: boolean
  overrideMin: number
  overrideMax: number
  syncSize: boolean
  settingsPresets: any[]
  selectedSettingsPreset: any
  settingsOverridden: boolean
}

export interface FlaggedWordsState {
  flaggedWordsText: string
  flaggedWordsCount: number
}

export interface RssState {
  rssEnabled: boolean
  rssPollingOn: boolean
  pollRssButtonText: string
  unreadRssCount: number
  rssPlayOn: boolean
  rssPlayWaitingBadgeText: string
  rssFeedUrl: string
  proxydUrl: string
  rssPollMins: number
  rssPlayMins: number
  playRssButtonText: string
}

export interface VoiceState {
  voiceEnabled: boolean
  voiceCapable: boolean
  voiceThinkingTime: number
  voiceAfterThinkingTime: number
  voiceVoiceIdx: number
  voiceVolume: number
  voiceRate: number
  voicePitch: number
  voiceLang: string
  voiceVoices: any[]
  voiceBufferMaxLength: number
  voiceSpelling: boolean
  voiceLastOnly: boolean
  manualVoice: boolean
  speakFirst: boolean
  speakFirstRepeats: number
  speakFirstAdditionalWordspaces: number
  voiceThinkingTimeWpm: any
}

export interface MorseContextValue {
  /** MorseViewModel — use for imperative calls and observable setters */
  vm: MorseViewModel

  // ── Text / display ────────────────────────────────────────────────────────
  rawText: string
  showingText: string
  showRaw: boolean
  textBuffer: string
  accessibilityAnnouncement: string

  // ── Playback ──────────────────────────────────────────────────────────────
  playerPlaying: boolean
  isPaused: boolean
  currentIndex: number
  isShuffled: boolean
  charsPlayed: number
  runningPlayMs: number
  preSpace: number
  preSpaceUsed: boolean
  xtraWordSpaceDits: number

  // ── Audio ─────────────────────────────────────────────────────────────────
  volume: number
  noiseEnabled: boolean
  noiseHidden: boolean
  noiseVolume: number
  noiseType: string

  // ── UI ────────────────────────────────────────────────────────────────────
  hideList: boolean
  showExpertSettings: boolean
  cardsVisible: boolean
  cardFontPx: number | undefined
  isDev: boolean
  adminMode: boolean
  morseDisabled: boolean

  // ── Loop / repeat ─────────────────────────────────────────────────────────
  loop: boolean
  loopnoshuffle: boolean
  numberOfRepeats: number

  // ── Trail reveal ──────────────────────────────────────────────────────────
  trailReveal: boolean
  trailPreDelay: number
  trailPostDelay: number
  trailFinal: number
  maxRevealedTrail: number

  // ── Advanced audio shaping ────────────────────────────────────────────────
  smoothing: boolean
  riseTimeConstant: number
  decayTimeConstant: number
  riseMsOffset: number
  decayMsOffset: number

  // ── Cards ─────────────────────────────────────────────────────────────────
  cardSpace: number
  shuffleIntraGroup: boolean
  allowSaveCookies: boolean

  // ── Computed values ───────────────────────────────────────────────────────
  words: WordInfo[]
  rawTextCharCount: number
  playingTime: PlayingTimeInfo
  applyEnabled: boolean

  // ── Sub-state domains ─────────────────────────────────────────────────────
  speed: SpeedState
  frequency: FrequencyState
  lessons: LessonState
  voice: VoiceState
  flaggedWords: FlaggedWordsState
  rss: RssState
  misc: MiscState

  // ── Misc ──────────────────────────────────────────────────────────────────
  allShortcutKeys: any[]
  morseLoadImages: any
}

// ─── Context ─────────────────────────────────────────────────────────────────

const MorseContext = createContext<MorseContextValue | null>(null)

// ─── KO → React bridge ───────────────────────────────────────────────────────

/** Read all current observable values into a plain snapshot object. */
function snapshot (vm: MorseViewModel): MorseContextValue {
  const l = vm.lessons
  const s = vm.settings
  const v = vm.morseVoice

  return {
    vm,

    rawText: vm.rawText(),
    showingText: vm.showingText(),
    showRaw: vm.showRaw(),
    textBuffer: vm.textBuffer(),
    accessibilityAnnouncement: vm.accessibilityAnnouncement(),

    playerPlaying: vm.playerPlaying(),
    isPaused: vm.isPaused(),
    currentIndex: vm.currentIndex(),
    isShuffled: vm.isShuffled(),
    charsPlayed: vm.charsPlayed(),
    runningPlayMs: vm.runningPlayMs(),
    preSpace: vm.preSpace(),
    preSpaceUsed: vm.preSpaceUsed(),
    xtraWordSpaceDits: vm.xtraWordSpaceDits(),

    volume: vm.volume(),
    noiseEnabled: vm.noiseEnabled(),
    noiseHidden: vm.noiseHidden(),
    noiseVolume: vm.noiseVolume(),
    noiseType: vm.noiseType(),

    hideList: vm.hideList(),
    showExpertSettings: vm.showExpertSettings(),
    cardsVisible: vm.cardsVisible(),
    cardFontPx: vm.cardFontPx(),
    isDev: vm.isDev(),
    adminMode: vm.adminMode(),
    morseDisabled: vm.morseDisabled(),

    loop: vm.loop(),
    loopnoshuffle: vm.loopnoshuffle(),
    numberOfRepeats: vm.numberOfRepeats(),

    trailReveal: vm.trailReveal(),
    trailPreDelay: vm.trailPreDelay(),
    trailPostDelay: vm.trailPostDelay(),
    trailFinal: vm.trailFinal(),
    maxRevealedTrail: vm.maxRevealedTrail(),

    smoothing: vm.smoothing(),
    riseTimeConstant: vm.riseTimeConstant(),
    decayTimeConstant: vm.decayTimeConstant(),
    riseMsOffset: vm.riseMsOffset(),
    decayMsOffset: vm.decayMsOffset(),

    cardSpace: vm.cardSpace(),
    shuffleIntraGroup: vm.shuffleIntraGroup(),
    allowSaveCookies: vm.allowSaveCookies(),

    words: vm.words(),
    rawTextCharCount: vm.rawTextCharCount(),
    playingTime: vm.playingTime(),
    applyEnabled: vm.applyEnabled(),

    allShortcutKeys: vm.allShortcutKeys(),
    morseLoadImages: vm.morseLoadImages(),

    speed: {
      wpm: s.speed.wpm(),
      fwpm: s.speed.fwpm(),
      syncWpm: s.speed.syncWpm(),
      speedInterval: s.speed.speedInterval(),
      intervalTimingsText: s.speed.intervalTimingsText(),
      intervalWpmText: s.speed.intervalWpmText(),
      intervalFwpmText: s.speed.intervalFwpmText(),
      vWpm: s.speed.vWpm(),
      vFwpm: s.speed.vFwpm(),
      variableSpeedDisplay: s.speed.variableSpeedDisplay(),
      trueWpm: s.speed.trueWpm()
    },

    frequency: {
      ditFrequency: s.frequency.ditFrequency(),
      dahFrequency: s.frequency.dahFrequency(),
      syncFreq: s.frequency.syncFreq()
    },

    lessons: {
      userTarget: l.userTarget(),
      selectedClass: l.selectedClass(),
      letterGroup: l.letterGroup(),
      selectedDisplay: l.selectedDisplay(),
      userTargets: l.userTargets(),
      classes: l.classes(),
      letterGroups: l.letterGroups(),
      displays: l.displays(),
      customGroup: l.customGroup(),
      randomizeLessons: l.randomizeLessons(),
      autoCloseLessonAccordion: l.autoCloseLessonAccordion(),
      ifStickySets: l.ifStickySets(),
      stickySets: l.stickySets(),
      ifOverrideTime: l.ifOverrideTime(),
      overrideMins: l.overrideMins(),
      ifOverrideMinMax: l.ifOverrideMinMax(),
      overrideMin: l.overrideMin(),
      overrideMax: l.overrideMax(),
      syncSize: l.syncSize(),
      settingsPresets: l.settingsPresets(),
      selectedSettingsPreset: l.selectedSettingsPreset(),
      settingsOverridden: l.settingsOverridden()
    },

    voice: {
      voiceEnabled: v.voiceEnabled(),
      voiceCapable: v.voiceCapable(),
      voiceThinkingTime: v.voiceThinkingTime(),
      voiceAfterThinkingTime: v.voiceAfterThinkingTime(),
      voiceVoiceIdx: v.voiceVoiceIdx(),
      voiceVolume: v.voiceVolume(),
      voiceRate: v.voiceRate(),
      voicePitch: v.voicePitch(),
      voiceLang: v.voiceLang(),
      voiceVoices: v.voiceVoices(),
      voiceBufferMaxLength: v.voiceBufferMaxLength(),
      voiceSpelling: v.voiceSpelling(),
      voiceLastOnly: v.voiceLastOnly(),
      manualVoice: v.manualVoice(),
      speakFirst: v.speakFirst(),
      speakFirstRepeats: v.speakFirstRepeats(),
      speakFirstAdditionalWordspaces: v.speakFirstAdditionalWordspaces(),
      voiceThinkingTimeWpm: v.voiceThinkingTimeWpm()
    },

    flaggedWords: {
      flaggedWordsText: vm.flaggedWords.flaggedWords(),
      flaggedWordsCount: vm.flaggedWords.flaggedWordsCount()
    },

    misc: {
      newlineChunking: s.misc.newlineChunking()
    },

    rss: {
      rssEnabled: vm.rss.rssEnabled(),
      rssPollingOn: vm.rss.rssPollingOn(),
      pollRssButtonText: vm.rss.pollRssButtonText(),
      unreadRssCount: vm.rss.unreadRssCount(),
      rssPlayOn: vm.rss.rssPlayOn(),
      rssPlayWaitingBadgeText: vm.rss.rssPlayWaitingBadgeText(),
      rssFeedUrl: vm.rss.rssFeedUrl(),
      proxydUrl: vm.rss.proxydUrl(),
      rssPollMins: vm.rss.rssPollMins(),
      rssPlayMins: vm.rss.rssPlayMins(),
      playRssButtonText: vm.rss.playRssButtonText()
    }
  }
}

/**
 * Subscribe to all ViewModel observables that matter for the UI.
 * When any changes, re-snapshot and set React state.
 */
function useKOBridge (vm: MorseViewModel): MorseContextValue {
  const [value, setValue] = useState<MorseContextValue>(() => snapshot(vm))

  useEffect(() => {
    const bump = () => setValue(snapshot(vm))
    const l = vm.lessons
    const s = vm.settings
    const v = vm.morseVoice

    const subs = [
      // Root VM observables
      vm.rawText.subscribe(bump),
      vm.showingText.subscribe(bump),
      vm.showRaw.subscribe(bump),
      vm.textBuffer.subscribe(bump),
      vm.accessibilityAnnouncement.subscribe(bump),
      vm.playerPlaying.subscribe(bump),
      vm.isPaused.subscribe(bump),
      vm.currentIndex.subscribe(bump),
      vm.isShuffled.subscribe(bump),
      vm.charsPlayed.subscribe(bump),
      vm.runningPlayMs.subscribe(bump),
      vm.preSpace.subscribe(bump),
      vm.preSpaceUsed.subscribe(bump),
      vm.xtraWordSpaceDits.subscribe(bump),
      vm.volume.subscribe(bump),
      vm.noiseEnabled.subscribe(bump),
      vm.noiseHidden.subscribe(bump),
      vm.noiseVolume.subscribe(bump),
      vm.noiseType.subscribe(bump),
      vm.hideList.subscribe(bump),
      vm.showExpertSettings.subscribe(bump),
      vm.cardsVisible.subscribe(bump),
      vm.cardFontPx.subscribe(bump),
      vm.isDev.subscribe(bump),
      vm.adminMode.subscribe(bump),
      vm.morseDisabled.subscribe(bump),
      vm.loop.subscribe(bump),
      vm.loopnoshuffle.subscribe(bump),
      vm.numberOfRepeats.subscribe(bump),
      vm.trailReveal.subscribe(bump),
      vm.trailPreDelay.subscribe(bump),
      vm.trailPostDelay.subscribe(bump),
      vm.trailFinal.subscribe(bump),
      vm.maxRevealedTrail.subscribe(bump),
      vm.smoothing.subscribe(bump),
      vm.riseTimeConstant.subscribe(bump),
      vm.decayTimeConstant.subscribe(bump),
      vm.riseMsOffset.subscribe(bump),
      vm.decayMsOffset.subscribe(bump),
      vm.cardSpace.subscribe(bump),
      vm.shuffleIntraGroup.subscribe(bump),
      vm.allowSaveCookies.subscribe(bump),
      vm.words.subscribe(bump),
      vm.rawTextCharCount.subscribe(bump),
      vm.playingTime.subscribe(bump),
      vm.applyEnabled.subscribe(bump),
      vm.allShortcutKeys.subscribe(bump),
      vm.morseLoadImages.subscribe(bump),

      // Speed settings
      s.speed.wpm.subscribe(bump),
      s.speed.fwpm.subscribe(bump),
      s.speed.syncWpm.subscribe(bump),
      s.speed.speedInterval.subscribe(bump),
      s.speed.intervalTimingsText.subscribe(bump),
      s.speed.intervalWpmText.subscribe(bump),
      s.speed.intervalFwpmText.subscribe(bump),
      s.speed.vWpm.subscribe(bump),
      s.speed.vFwpm.subscribe(bump),
      s.speed.variableSpeedDisplay.subscribe(bump),
      s.speed.trueWpm.subscribe(bump),

      // Misc settings
      s.misc.newlineChunking.subscribe(bump),

      // Frequency settings
      s.frequency.ditFrequency.subscribe(bump),
      s.frequency.dahFrequency.subscribe(bump),
      s.frequency.syncFreq.subscribe(bump),

      // Lesson plugin
      l.userTarget.subscribe(bump),
      l.selectedClass.subscribe(bump),
      l.letterGroup.subscribe(bump),
      l.selectedDisplay.subscribe(bump),
      l.wordLists.subscribe(bump),
      l.classes.subscribe(bump),
      l.letterGroups.subscribe(bump),
      l.displays.subscribe(bump),
      l.customGroup.subscribe(bump),
      l.randomizeLessons.subscribe(bump),
      l.autoCloseLessonAccordion.subscribe(bump),
      l.ifStickySets.subscribe(bump),
      l.stickySets.subscribe(bump),
      l.ifOverrideTime.subscribe(bump),
      l.overrideMins.subscribe(bump),
      l.ifOverrideMinMax.subscribe(bump),
      l.trueOverrideMin.subscribe(bump),
      l.trueOverrideMax.subscribe(bump),
      l.syncSize.subscribe(bump),
      l.settingsPresets.subscribe(bump),
      l.selectedSettingsPreset.subscribe(bump),
      l.settingsOverridden.subscribe(bump),

      // Voice
      v.voiceEnabled.subscribe(bump),
      v.voiceCapable.subscribe(bump),
      v.voiceThinkingTime.subscribe(bump),
      v.voiceAfterThinkingTime.subscribe(bump),
      v.voiceVoiceIdx.subscribe(bump),
      v.voiceVolume.subscribe(bump),
      v.voiceRate.subscribe(bump),
      v.voicePitch.subscribe(bump),
      v.voiceLang.subscribe(bump),
      v.voiceVoices.subscribe(bump),
      v.voiceBufferMaxLength.subscribe(bump),
      v.voiceSpelling.subscribe(bump),
      v.voiceLastOnly.subscribe(bump),
      v.manualVoice.subscribe(bump),
      v.speakFirst.subscribe(bump),
      v.speakFirstRepeats.subscribe(bump),
      v.speakFirstAdditionalWordspaces.subscribe(bump),
      v.voiceThinkingTimeWpm.subscribe(bump),

      // FlaggedWords
      vm.flaggedWords.flaggedWords.subscribe(bump),
      vm.flaggedWords.flaggedWordsCount.subscribe(bump),

      // RSS
      vm.rss.rssEnabled.subscribe(bump),
      vm.rss.rssPollingOn.subscribe(bump),
      vm.rss.pollRssButtonText.subscribe(bump),
      vm.rss.unreadRssCount.subscribe(bump),
      vm.rss.rssPlayOn.subscribe(bump),
      vm.rss.rssPlayWaitingBadgeText.subscribe(bump),
      vm.rss.rssFeedUrl.subscribe(bump),
      vm.rss.proxydUrl.subscribe(bump),
      vm.rss.rssPollMins.subscribe(bump),
      vm.rss.rssPlayMins.subscribe(bump),
      vm.rss.playRssButtonText.subscribe(bump)
    ]

    return () => {
      subs.forEach(s => s.dispose())
    }
  }, [vm])

  return value
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface MorseProviderProps {
  vm: MorseViewModel
  children?: ReactNode
}

export function MorseProvider ({ vm, children }: MorseProviderProps) {
  const value = useKOBridge(vm)
  return <MorseContext.Provider value={value}>{children}</MorseContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMorse (): MorseContextValue {
  const ctx = useContext(MorseContext)
  if (!ctx) {
    throw new Error('useMorse must be used inside <MorseProvider>')
  }
  return ctx
}
