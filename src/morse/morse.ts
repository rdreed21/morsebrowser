import { observable, Observable, computed, observableArray, ObservableArray } from './utils/observable'
import MorseStringUtils from './utils/morseStringUtils'
import { SoundMakerConfig } from './player/soundmakers/SoundMakerConfig'
import { MorseWordPlayer } from './player/morseWordPlayer'
import MorseLessonPlugin from './lessons/morseLessonPlugin'
import { MorseLoadImages } from './images/morseLoadImages'
import { MorseShortcutKeys } from './shortcutKeys/morseShortcutKeys'
import { MorseCookies } from './cookies/morseCookies'
import { MorseSettings } from './settings/settings'
import { MorseVoice } from './voice/MorseVoice'
import { FlaggedWords } from './flaggedWords/flaggedWords'
import { NoiseConfig } from './player/soundmakers/NoiseConfig'
import { effectiveNoiseType } from './player/soundmakers/noisePlayback'
import MorseRssPlugin from './rss/morseRssPlugin'
import { RssConfig } from './rss/RssConfig'
import { CardBufferManager } from './utils/cardBufferManager'
import WordInfo from './utils/wordInfo'
import { PlayingTimeInfo } from './utils/playingTimeInfo'
import { SettingsChangeInfo } from './settings/settingsChangeInfo'
import { VoiceBufferInfo } from './voice/VoiceBufferInfo'
import { GeneralUtils } from './utils/general'
import MorseSettingsHandler from './settings/morseSettingsHandler'
import ScreenWakeLock from './utils/screenWakeLock'

export class MorseViewModel {
  accessibilityAnnouncement:Observable<string> = observable('')
  textBuffer:Observable<string> = observable('')
  hideList:Observable<boolean> = observable(true)
  currentIndex:Observable<number> = observable(0)
  playerPlaying:Observable<boolean> = observable(false)
  lastFullPlayTime:Observable<any> = observable(new Date(1900, 0, 0).getMilliseconds())
  preSpace:Observable<number> = observable(0)
  preSpaceUsed:Observable<boolean> = observable(false)
  xtraWordSpaceDits:Observable<number> = observable(0)
  isShuffled:Observable<boolean> = observable(false)
  trailReveal:Observable<boolean> = observable(false)
  preShuffled:string = ''
  morseWordPlayer:MorseWordPlayer
  rawText:Observable<string> = observable('')
  showingText:Observable<string> = observable('')
  showRaw:Observable<boolean> = observable(true)
  volume:Observable<number> = observable(10)
  noiseHidden:Observable<boolean> = observable(true)
  noiseEnabled:Observable<boolean> = observable(false)
  noiseVolume:Observable<number> = observable(2)
  noiseType:Observable<string> = observable('off')
  lastPlayFullStart: number | null = null
  runningPlayMs:Observable<number> = observable(0)
  lastPartialPlayStart:Observable<any> = observable(undefined)
  isPaused:Observable<boolean> = observable(false)
  morseLoadImages:Observable<any> = observable(undefined)
  showExpertSettings:Observable<boolean> = observable(false)
  cardFontPx:Observable<any> = observable(undefined)
  loop:Observable<boolean> = observable(false)
  loopnoshuffle:Observable<boolean> = observable(false)
  morseVoice:MorseVoice
  shortcutKeys:MorseShortcutKeys
  // note this is whether you see any cards at all,
  // not whether the words on them are obscured
  cardsVisible:Observable<boolean> = observable(true)
  trailPreDelay:Observable<number> = observable(0)
  trailPostDelay:Observable<number> = observable(0)
  trailFinal:Observable<number> = observable(1)
  maxRevealedTrail:Observable<number> = observable(-1)
  isDev:Observable<boolean> = observable(false)
  riseTimeConstant:Observable<number> = observable(0.001)
  decayTimeConstant:Observable<number> = observable(0.001)
  riseMsOffset:Observable<number> = observable(1.5)
  decayMsOffset:Observable<number> = observable(1.5)
  smoothing:Observable<boolean> = observable(true)
  morseDisabled:Observable<boolean> = observable(false)
  settings:MorseSettings
  lessons:MorseLessonPlugin
  flaggedWords:FlaggedWords
  doPlayTimeout:any
  rss:MorseRssPlugin
  lastShuffled:string = ''
  flaggedWordsLogCount:number = 0
  flaggedWordsLog:any[] = []
  cardBufferManager:CardBufferManager
  charsPlayed:Observable<number> = observable(0)
  cardSpace:Observable<number> = observable(0)
  cardSpaceTimerHandle:any = 0
  allowSaveCookies:Observable<boolean> = observable(true)
  lockoutSaveCookiesTimerHandle:any = null
  currentSerializedSettings:any = null
  allShortcutKeys:ObservableArray<any>
  applyEnabled:Observable<boolean>
  words:Observable<WordInfo[]>
  rawTextCharCount:Observable<number>
  timeEstimate:Observable<any>
  playingTime:Observable<PlayingTimeInfo>
  numberOfRepeats:Observable<number> = observable(0)
  testTonePlaying:boolean = false
  testToneCount:number = 0
  testToneFlagHandle:any = 0
  screenWakeLock:ScreenWakeLock
  logoClickCount:number = 0
  cachedShuffle:boolean = false
  shuffleIntraGroup:Observable<boolean> = observable(false)
  adminMode:Observable<boolean> = observable(false)

  // END observable declarations
  constructor () {
    // initialize the images/icons
    this.morseLoadImages(new MorseLoadImages())

    // create settings
    this.settings = new MorseSettings(this)

    // initialize the main rawText
    this.rawText(this.showingText())

    this.lessons = new MorseLessonPlugin(this.settings, (s: string) => { this.setText(s) }, (str: string) => {
      const config = this.getMorseStringToWavBufferConfig(str)
      const est = this.morseWordPlayer.getTimeEstimate(config)
      return est
    }, this)

    this.rss = new MorseRssPlugin(new RssConfig(this.setText, this.fullRewind, this.doPlay, this.lastFullPlayTime, this.playerPlaying))

    // check for admin mode turned on
    if (GeneralUtils.getParameterByName('adminMode')) {
      console.log('admin mode enabled')
      this.adminMode(true)
    }

    // check for RSS feature turned on
    if (GeneralUtils.getParameterByName('rssEnabled')) {
      this.rss.rssEnabled(true)
    }

    if (GeneralUtils.getParameterByName('morseDisabled')) {
      this.morseDisabled(GeneralUtils.getParameterByName('morseDisabled') === 'true')
    }

    this.morseWordPlayer = new MorseWordPlayer()
    this.morseWordPlayer.setSoundMaker(this.smoothing())

    // voice
    this.morseVoice = new MorseVoice(this)
    // after 5 seconds, run this.morseVoice.initEasySpeech()
    setTimeout(() => { this.morseVoice.initEasySpeech() }, 5000)

    this.loadDefaultsAndCookieSettings()

    // After persisted settings: optional URL override for background noise (?noiseEnabled=true|false)
    const noiseUrl = GeneralUtils.getParameterByName('noiseEnabled')
    if (noiseUrl !== null) {
      if (noiseUrl === 'true' && this.noiseType() === 'off') {
        this.noiseType('white')
      } else if (noiseUrl === 'false') {
        this.noiseType('off')
      }
    }
    this.noiseEnabled(effectiveNoiseType(this.noiseType()) !== 'off')

    // initialize the wordlist
    this.lessons.initializeWordList()

    // Force showRaw to false NOW, before restoreLessonState.
    // licwdefaults.json sets showRaw=true, and setText() branches on showRaw():
    // if true it stores into showingText (the editable textarea), not rawText.
    // The showRaw.subscribe that would clear showingText isn't wired until after
    // the constructor, so leaving showRaw=true here causes the raw {word|speech}
    // lesson content to appear in the textarea on first render.
    this.showRaw(false)

    // Restore lesson dropdown state from localStorage before saveToStorage
    // subscriptions are wired up below, so intermediate resets (selectedClass='',
    // letterGroup='') never reach localStorage.
    this.lessons.restoreLessonState()

    this.flaggedWords = new FlaggedWords()

    // check for voice feature turned on
    if (GeneralUtils.getParameterByName('voiceEnabled')) {
      this.morseVoice.voiceEnabled(true)
    }

    // check for voicebuffermax
    const voiceBufferMaxParam = GeneralUtils.getParameterByName('voiceBufferMax')
    if (voiceBufferMaxParam) {
      this.morseVoice.voiceBufferMaxLength(parseInt(voiceBufferMaxParam))
    }
    // are we on the dev site?
    this.isDev(window.location.href.toLowerCase().indexOf('/dev/') > -1)

    // card buffer manager
    this.cardBufferManager = new CardBufferManager(() => this.currentIndex(), () => this.words())

    // Keep track of registered shortcut keys in an observable array
    // so we can display them on the page without having to hard-code them.
    this.allShortcutKeys = observableArray([])
    this.shortcutKeys = new MorseShortcutKeys((key, title) => {
      this.allShortcutKeys.push({ key, title })
    })
    this.shortcutKeys.registerKeyboardShortcutHandlers(this)

    this.applyEnabled = computed(() => {
      if (this.lessons && this.lessons.customGroup()) {
        return true
      }
      return this.lessons.selectedDisplay().display && !this.lessons.selectedDisplay().isDummy
    }, [this.lessons.customGroup, this.lessons.selectedDisplay])

    this.words = computed(() => {
      if (!this.rawText()) {
        return []
      }
      return MorseStringUtils.getWords(this.rawText(), this.settings.misc.newlineChunking())
    }, [this.rawText, this.settings.misc.newlineChunking])

    this.rawTextCharCount = computed(() => {
      if (!this.rawText()) {
        return 0
      }
      return this.rawText().replace(' ', '').length
    }, [this.rawText])

    this.playingTime = computed(():PlayingTimeInfo => {
      const minutes = Math.floor(this.runningPlayMs() / 60000)
      const seconds = parseFloat(((this.runningPlayMs() % 60000) / 1000).toFixed(0))
      const timeFigures = new PlayingTimeInfo(minutes, seconds)
      return timeFigures
    }, [this.runningPlayMs])

    this.timeEstimate = computed(() => {
      if (!this.rawText()) {
        return { minutes: 0, seconds: 0, normedSeconds: '00' }
      }
      const config = this.getMorseStringToWavBufferConfig(this.words().map(w => w.displayWord).join(' '))
      const est = this.morseWordPlayer.getTimeEstimate(config)
      const minutes = Math.floor(est.timeCalcs.totalTime / 60000)
      const seconds = ((est.timeCalcs.totalTime % 60000) / 1000).toFixed(0)
      const normedSeconds = (parseInt(seconds) < 10 ? '0' : '') + seconds
      return { minutes, seconds, normedSeconds }
    }, [this.rawText, this.words])

    this.screenWakeLock = new ScreenWakeLock()

    // ── Side-effect subscriptions (replaces morseExtenders) ──────────────────

    const allow = () => this.allowSaveCookies()
    // Track all [observable, key] pairs so we can flush them when a lockout lifts.
    const persist: Array<[Observable<any>, string]> = []
    const saveToStorage = <T>(obs: Observable<T>, key: string) => {
      persist.push([obs, key])
      obs.subscribe(v => {
        if (allow()) localStorage.setItem(key, String(v))
      })
    }

    // localStorage persistence
    saveToStorage(this.hideList, 'hideList')
    saveToStorage(this.preSpace, 'preSpace')
    saveToStorage(this.xtraWordSpaceDits, 'xtraWordSpaceDits')
    saveToStorage(this.volume, 'volume')
    saveToStorage(this.noiseVolume, 'noiseVolume')
    saveToStorage(this.noiseType, 'noiseType')
    saveToStorage(this.showExpertSettings, 'showExpertSettings')
    saveToStorage(this.cardFontPx, 'cardFontPx')
    saveToStorage(this.settings.speed.syncWpm, 'syncWpm')
    saveToStorage(this.settings.speed.wpm, 'wpm')
    saveToStorage(this.settings.speed.fwpm, 'fwpm')
    saveToStorage(this.settings.frequency.ditFrequency, 'ditFrequency')
    saveToStorage(this.settings.frequency.dahFrequency, 'dahFrequency')
    saveToStorage(this.settings.frequency.syncFreq, 'syncFreq')
    saveToStorage(this.lessons.autoCloseLessonAccordion, this.lessons.autoCloseCookieName)
    saveToStorage(this.rss.rssFeedUrl, 'rssFeedUrl')
    saveToStorage(this.rss.proxydUrl, 'proxydUrl')
    saveToStorage(this.rss.rssPlayMins, 'rssPlayMins')
    saveToStorage(this.rss.rssPollMins, 'rssPollMins')
    saveToStorage(this.morseVoice.voiceVoiceName, 'voiceVoiceName')

    // Lesson selection persistence
    saveToStorage(this.lessons.userTarget, 'lesson_userTarget')
    saveToStorage(this.lessons.selectedClass, 'lesson_selectedClass')
    saveToStorage(this.lessons.letterGroup, 'lesson_letterGroup')
    this.lessons.selectedDisplay.subscribe(d => {
      if (allow() && d?.display) localStorage.setItem('lesson_selectedLesson', d.display)
    })

    // When the preset-apply lockout (allowSaveCookies=false for 700ms) lifts,
    // flush all current observable values so preset-applied settings (wpm, fwpm, etc.)
    // are captured even though they changed while saves were blocked.
    this.allowSaveCookies.subscribe((allowed: boolean) => {
      if (allowed) {
        persist.forEach(([obs, key]) => localStorage.setItem(key, String(obs())))
        const d = this.lessons.selectedDisplay()
        if (d?.display) localStorage.setItem('lesson_selectedLesson', d.display)
      }
    })
    // Save preset label without the allow() lockout guard — we only want to remember
    // which preset was last shown, not reapply settings on restore.
    this.lessons.selectedSettingsPreset.subscribe((p: any) => {
      if (p?.display && !p.isDummy) localStorage.setItem('lesson_selectedSettingsPreset', p.display)
    })

    // showingText → rawText (when showRaw is on)
    this.showingText.subscribe(newValue => {
      if (this.showRaw()) {
        this.rawText(newValue)
      }
    })

    // showRaw → sync showingText
    this.showRaw.subscribe(newValue => {
      if (newValue) {
        this.showingText(this.rawText())
      } else {
        this.showingText('')
      }
    })

    // showRaw was set to false in the constructor before this subscribe was wired,
    // so the subscriber never fired. Clear showingText now to remove the default
    // licwdefaults.json value ("{CQ|c q} {LICW|l i c w}") from the textarea.
    if (!this.showRaw()) {
      this.showingText('')
    }

    // volume → audio player
    this.volume.subscribe(newValue => {
      this.morseWordPlayer.setVolume(newValue)
    })

    // noiseVolume → audio player
    this.noiseVolume.subscribe(newValue => {
      this.morseWordPlayer.setNoiseVolume(newValue)
    })

    // noiseType → audio player (noiseEnabled mirrors whether type is a real noise colour)
    this.noiseType.subscribe(() => {
      this.noiseEnabled(effectiveNoiseType(this.noiseType()) !== 'off')
      this.morseWordPlayer.setNoiseType(this.getMorseStringToWavBufferConfig(''))
    })

    // rawText → undo shuffle if text changed externally
    this.rawText.subscribe(newValue => {
      if (this.isShuffled()) {
        if (this.lastShuffled !== newValue) {
          this.isShuffled(false)
        }
      }
    })

    // playerPlaying → screen wake lock
    this.playerPlaying.subscribe(newValue => {
      if (newValue) {
        this.screenWakeLock.activate()
      } else {
        this.screenWakeLock.deactivate()
      }
    })
  }
  // END CONSTRUCTOR

  loadDefaultsAndCookieSettings = () => {
    // load defaults
    let settingsInfo = new SettingsChangeInfo(this)
    settingsInfo.ifLoadSettings = true
    MorseCookies.loadCookiesOrDefaults(settingsInfo)

    // load cookies
    settingsInfo = new SettingsChangeInfo(this)
    settingsInfo.ifLoadSettings = false
    MorseCookies.loadCookiesOrDefaults(settingsInfo)
  }

  logToFlaggedWords = (s: string) => {
    /* this.flaggedWordsLogCount++
    this.flaggedWordsLog[0] = { timeStamp: 0, msg: `LOGGED LINES:${this.flaggedWordsLogCount}` }
    const timeStamp = new Date()
    this.flaggedWordsLog[this.flaggedWordsLog.length] = { timeStamp, msg: `${s}` }
    const myPieces = this.flaggedWordsLog.map((e, i, a) => {
      return `${i < 2 ? e.timeStamp : e.timeStamp - a[i - 1].timeStamp}: ${e.msg}`
    })
    const out = myPieces.filter(s => s).join('\n')
    this.flaggedWords.flaggedWords(out) */
  }

  changeSentance = () => {
    this.currentIndex(0)
  }

  setText = (s:string) => {
    if (this.showRaw()) {
      this.showingText(s)
    } else {
      this.rawText(s)
    }
    // whenever text changes, clear the voice buffer
    this.morseVoice.voiceBuffer = []
  }

  shuffleWords = (fromLoopRestart:boolean = false) => {
    console.log(`shuffleWords called, isShuffled:${this.isShuffled()}, fromLoopRestart:${fromLoopRestart}`)
    // if it's not currently shuffled, or we're in a loop, re-shuffle
    if (!this.isShuffled() || fromLoopRestart) {
      const hasPhrases = this.rawText().indexOf('\n') !== -1 && this.settings.misc.newlineChunking()
      // if we're in a loop or otherwise already shuffled, we don't want to lose the preShuffled
      if (!this.isShuffled()) {
        this.preShuffled = this.rawText()
      }

      const shuffleArray = <T>(arr:T[]):T[] => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = copy[i]
          copy[i] = copy[j]
          copy[j] = tmp
        }
        return copy
      }

      const words = [...this.words()]

      // Build "shuffle units" where a unit is either:
      // - a single ungrouped word
      // - a grouped block containing all words sharing a groupId (in original relative order)
      const groupMap = new Map<number, { firstIndex:number, words:WordInfo[] }>()
      const ungroupedUnits:WordInfo[][] = []

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const groupId = word.getGroupId()
        if (groupId == null) {
          ungroupedUnits.push([word])
          continue
        }

        const existing = groupMap.get(groupId)
        if (existing) {
          existing.words.push(word)
        } else {
          groupMap.set(groupId, { firstIndex: i, words: [word] })
        }
      }

      const groupedUnits = [...groupMap.entries()]
        .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
        .map(([, info]) => {
          if (this.shuffleIntraGroup && this.shuffleIntraGroup()) {
            return shuffleArray(info.words)
          }
          return [...info.words]
        })

      const shuffleUnits:WordInfo[][] = [...groupedUnits, ...ungroupedUnits]

      // Fisher-Yates shuffle on the units (not individual words) so grouped blocks stay intact.
      const shuffledUnits = shuffleArray(shuffleUnits)

      const shuffledWords = shuffledUnits.flat()
      this.lastShuffled = shuffledWords.map(w => w.rawWord).join(hasPhrases ? '\n' : ' ')
      this.setText(this.lastShuffled)
      if (!this.isShuffled()) {
        this.isShuffled(true)
      }
    } else {
      // otherwise, user wants things put back the way they were
      this.setText(this.preShuffled)
      this.isShuffled(false)
    }
  }

  incrementIndex = () => {
    if (this.currentIndex() < this.words().length - 1) {
      this.currentIndex(this.currentIndex() + 1)
    }
  }

  decrementIndex = () => {
    this.morseWordPlayer.pause(() => {
      if (this.currentIndex() > 0 && this.words().length > 1) {
        this.currentIndex(this.currentIndex() - 1)
        // experience shows it is good to put a little pause here
        // so they dont' blur together
        setTimeout(this.doPlay, 1000)
      }
    }, false)
  }

  fullRewind = () => {
    this.currentIndex(0)
  }

  sentanceRewind = () => {
    this.currentIndex(0)
  }

  setWordIndex = (index: number) => {
    if (!this.playerPlaying()) {
      this.currentIndex(index)
    } else {
      this.doPause(false, false, false)
      this.currentIndex(index)
      this.doPlay(false, false)
    }
  }

  setFlagged = () => {
    if (this.flaggedWords.flaggedWords().trim()) {
      this.doPause(true, false, false)
      this.setText(this.flaggedWords.flaggedWords())
      this.fullRewind()
      document.getElementById('btnFlaggedWordsAccordianButton')!.click()
    }
  }

  clearFlagged = () => {
    if (this.flaggedWords.flaggedWords().trim()) {
      this.flaggedWords.clear()
      document.getElementById('btnFlaggedWordsAccordianButton')!.click()
    }
  }

  getMorseStringToWavBufferConfig = (text: string, isToneTest:boolean = false) => {
    const config = new SoundMakerConfig()
    config.word = MorseStringUtils.doReplacements(text)
    const speeds = this.settings.speed.getApplicableSpeed(this.playingTime())
    config.wpm = parseInt(speeds.wpm as any)
    config.fwpm = parseInt(speeds.fwpm as any)
    config.ditFrequency = parseInt(this.settings.frequency.ditFrequency() as any)
    config.dahFrequency = parseInt(this.settings.frequency.dahFrequency() as any)
    if (!isToneTest) {
      config.prePaddingMs = this.preSpaceUsed() ? 0 : this.preSpace() * 1000
    } else {
      config.prePaddingMs = 0
    }
    // note this was changed so UI is min 1 meaning 0, 1=>7, 2=>14 etc
    config.xtraWordSpaceDits = (parseInt(this.xtraWordSpaceDits() as any) - 1) * 7
    config.volume = parseInt(this.volume() as any)
    config.noise = new NoiseConfig()
    config.noise.type = effectiveNoiseType(this.noiseType())
    config.noise.volume = parseInt(this.noiseVolume() as any)
    config.playerPlaying = this.playerPlaying()
    config.riseTimeConstant = parseFloat(this.riseTimeConstant() as any)
    config.decayTimeConstant = parseFloat(this.decayTimeConstant() as any)
    config.riseMsOffset = parseFloat(this.riseMsOffset() as any)
    config.decayMsOffset = parseFloat(this.decayMsOffset() as any)
    // suppress wordspaces when using speak so "thinking time" will control
    if (this.morseVoice && !this.morseVoice.manualVoice() && this.ifMaxVoiceBufferReached()) {
      config.trimLastWordSpace = this.morseVoice.voiceEnabled() && !this.cardBufferManager.hasMoreMorse()
      config.voiceEnabled = this.morseVoice.voiceEnabled()
    }
    config.morseDisabled = this.morseDisabled()
    if (isToneTest) {
      config.trimLastWordSpace = true
    }
    config.isToneTest = isToneTest

    return config
  }

  testTone = () => {
    if (!this.testTonePlaying) {
      const config = this.getMorseStringToWavBufferConfig('T', true)
      config.isToneTest = true
      this.testTonePlaying = true
      if (this.testToneFlagHandle) {
        clearTimeout(this.testToneFlagHandle)
      }
      this.morseWordPlayer.play(config, (fromVoiceOrTrail: any) => {})
      this.testToneFlagHandle = setTimeout(() => {
        this.testTonePlaying = false
      }, config.testToneDuration)
    } else {
      clearTimeout(this.testToneFlagHandle)
      this.morseWordPlayer.pause(() => {
        this.testTonePlaying = false
      }, false)
    }
  }

  // Convenience method for toggling playback
  togglePlayback = () => {
    if (this.playerPlaying()) {
      this.doPause(false, true, false)
    } else {
      this.doPlay(true, false)
    }
  }

  doPlay = (playJustEnded:boolean, fromPlayButton:boolean) => {
    if (!this.rawText().trim()) {
      return
    }
    const wasPlayerPlaying = this.playerPlaying()
    const freshStart = fromPlayButton && !wasPlayerPlaying
    if (!this.lastPlayFullStart || (this.lastFullPlayTime() > this.lastPlayFullStart)) {
      this.lastPlayFullStart = Date.now()
    }
    this.isPaused(false)
    this.playerPlaying(true)
    if (!playJustEnded) {
      this.preSpaceUsed(false)
    }

    if (freshStart) {
      this.runningPlayMs(0)
      // clear the voice cache
      this.morseVoice.voiceBuffer = []
      // prime the pump for safari
      this.morseVoice.primeThePump()
      // clear the card buffer
      this.cardBufferManager.clear()
      this.charsPlayed(0)
      // speakfirst prep
      this.morseVoice.speakFirstLastCardIndex = -1
    }
    if (this.doPlayTimeout) {
      clearTimeout(this.doPlayTimeout)
    }

    this.doPlayTimeout = setTimeout(() => {
      this.morseWordPlayer.pause(() => {
        this.maxRevealedTrail(this.currentIndex() - 1)

        const repeats = parseInt(this.numberOfRepeats() as any) === 0 ? 0 : parseInt(this.numberOfRepeats() as any) + 1
        const config = this.getMorseStringToWavBufferConfig(
          this.cardBufferManager.getNextMorse(
            repeats,
            parseInt(this.morseVoice.speakFirstAdditionalWordspaces() as any)
          )
        )
        this.addToVoiceBuffer()
        const playerCmd = () => {
          if (!this.morseVoice.speakFirst() || this.playerPlaying()) {
            this.morseWordPlayer.play(config, (fromVoiceOrTrail: any) => {
              this.charsPlayed(this.charsPlayed() + config.word.replace(' ', '').length)
              this.playEnded(fromVoiceOrTrail)
            })
          }
        }

        if (!this.morseVoice.speakFirst() ||
            (this.morseVoice.speakFirst() && (this.morseVoice.speakFirstLastCardIndex === this.currentIndex()))
        ) {
          playerCmd()
        } else {
          const phraseToSpeak = this.getPhraseToSpeakFromBuffer()
          setTimeout(() => {
            const finalPhraseToSpeak = this.prepPhraseToSpeakForFinal(phraseToSpeak)
            this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
              // what gets called after speaking
              this.morseVoice.speakFirstLastCardIndex = this.currentIndex()
              playerCmd()
            })
          }, this.morseVoice.voiceThinkingTime() * 1000)
        }
        this.lastPartialPlayStart(Date.now())
        this.preSpaceUsed(true)
      }, false)
    },
    // timeout parameters
    playJustEnded || fromPlayButton ? 0 : 1000)
  }

  ifMaxVoiceBufferReached = ():boolean => {
    // ignore if is 1
    if (this.morseVoice.voiceBufferMaxLength() === 1) {
      return true
    }
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    if (!isNotLastWord) {
      return true
    }
    const maxBufferReached = this.morseVoice.voiceBuffer.length === parseInt(this.morseVoice.voiceBufferMaxLength() as any)
    return maxBufferReached
  }

  playEnded = (fromVoiceOrTrail: any) => {
    console.log(`playEnded fromVoiceOrTrail:${fromVoiceOrTrail}`)

    if (fromVoiceOrTrail && !this.playerPlaying()) {
      return
    }

    if (this.morseVoice.speakFirst() && !this.playerPlaying()) {
      return
    }
    // where are we in the words to process?
    const isNotLastWord = this.currentIndex() < this.words().length - 1
    const anyNewLines = this.rawText().indexOf('\n') !== -1
    const maxBufferReached = this.ifMaxVoiceBufferReached()
    const needToSpeak = this.morseVoice.voiceEnabled() &&
      !fromVoiceOrTrail &&
      !this.cardBufferManager.hasMoreMorse() &&
      maxBufferReached &&
      !this.morseVoice.speakFirst()

    const needToTrail = this.trailReveal() && !fromVoiceOrTrail
    const speakAndTrail = needToSpeak && needToTrail

    const noDelays = !needToSpeak && !needToTrail

    const advanceTrail = () => {
      // note we eliminate the trail delays if speaking
      if (this.trailReveal()) {
        setTimeout(() => {
          this.maxRevealedTrail(this.maxRevealedTrail() + 1)
          setTimeout(() => {
            // if speak is in the driver's seat it will call this,
            // if not then trail will
            if (!speakAndTrail) {
              this.playEnded(true)
            }
          }, speakAndTrail ? 0 : this.trailPostDelay() * 1000)
        }
        , speakAndTrail ? 0 : this.trailPreDelay() * 1000)
      }
    }

    const finalizeTrail = (finalCallback: () => void) => {
      if (this.trailReveal()) {
        setTimeout(() => {
          this.maxRevealedTrail(-1)
          finalCallback()
        }
        , this.trailFinal() * 1000)
      }
    }

    if (noDelays) {
      // no speaking, so play more morse
      this.runningPlayMs(this.runningPlayMs() + (Date.now() - this.lastPartialPlayStart()))
      if (isNotLastWord || this.cardBufferManager.hasMoreMorse()) {
        let cardChanged = false
        const hasMoreMorse = this.cardBufferManager.hasMoreMorse()
        if (!hasMoreMorse) {
          if (this.morseVoice.speakFirst()) {
            // clear the buffer
            this.morseVoice.voiceBuffer = []
          }
          this.incrementIndex()
          cardChanged = true
        }

        const getCardSpaceTimerHandleDelay = () => {
          if (!cardChanged && hasMoreMorse) {
            return 0
          } else {
            return this.cardSpace() * 1000
          }
        }
        this.cardSpaceTimerHandle = setTimeout(() => {
          this.doPlay(true, false)
        }, getCardSpaceTimerHandleDelay())
      } else {
      // nothing more to play
        const finalToDo = () => this.doPause(true, false, false)
        // trailing may want a linger
        if (this.trailReveal()) {
          finalizeTrail(finalToDo)
        } else {
          finalToDo()
        }
      }
    }

    if (needToSpeak) {
      // speak the voice buffer if there's a newline or nothing more to play
      const speakText = this.morseVoice.voiceBuffer[0].txt
      const hasNewline = speakText.indexOf('\n') !== -1

      const speakCondition = !this.morseVoice.manualVoice() &&
                (hasNewline || !isNotLastWord || !anyNewLines || !this.settings.misc.newlineChunking())
      if (speakCondition) {
        let phraseToSpeak = this.getPhraseToSpeakFromBuffer()
        if (this.morseVoice.voiceLastOnly()) {
          const phrasePieces = phraseToSpeak.split(' ')
          phraseToSpeak = phrasePieces[phrasePieces.length - 1]
        }

        setTimeout(() => {
          const finalPhraseToSpeak = this.prepPhraseToSpeakForFinal(phraseToSpeak)
          this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
            // what gets called after speaking

            if (needToTrail) {
              advanceTrail()
            }
            this.playEnded(true)
          })
        }, this.morseVoice.voiceThinkingTime() * 1000)
      } else {
        this.playEnded(true)
      }
    }

    // if trail is turned on but not speaking
    if (needToTrail && !speakAndTrail) {
      advanceTrail()
    }
  }

  prepPhraseToSpeakForFinal = (beforePhrase:string):string => {
    const afterPhrase = beforePhrase.replace(/\|/g, ' ')
      .replace(/\WV\W/g, ' VEE ')
      .replace(/^V\W/g, ' VEE ')
      .replace(/\WV$/g, ' VEE ')
    return afterPhrase
  }

  addToVoiceBuffer = () => {
    // make sure we don't add the same card twice...someday figure what causes
    const lastBufIndex = this.morseVoice.voiceBuffer.length > 0 ? this.morseVoice.voiceBuffer[this.morseVoice.voiceBuffer.length - 1].idx : -1
    if (this.currentIndex() > lastBufIndex &&
        this.currentIndex() >= this.morseVoice.voiceBuffer.length) {
    // populate the voiceBuffer even if not speaking, as we might be caching
      const currentWord = this.words()[this.currentIndex()]
      const speakText = currentWord.speakText(this.morseVoice.voiceSpelling())
      const vbInfo = new VoiceBufferInfo()
      vbInfo.txt = speakText
      vbInfo.idx = this.currentIndex()
      this.morseVoice.voiceBuffer.push(vbInfo)
    }
  }

  // used by recap
  speakVoiceBuffer = () => {
    if (this.morseVoice.voiceBuffer.length > 0) {
      const phrase = this.morseVoice.voiceBuffer.shift()!.txt
      const finalPhraseToSpeak = phrase.replace(/\|/g, ' ')
        .replace(/\|/g, ' ')
        .replace(/\WV\W/g, ' VEE ')
        .replace(/^V\W/g, ' VEE ')
        .replace(/\WV$/g, ' VEE ')
      this.morseVoice.speakPhrase(finalPhraseToSpeak, () => {
      // what gets called after speaking
        setTimeout(() => { this.speakVoiceBuffer() }, 250)
      })
    }
  }

  getPhraseToSpeakFromBuffer = () => {
    let phraseToSpeak: string = ''
    try {
      const joinedBuffer = this.morseVoice.voiceBuffer.map(m => m.txt).join(' ')
      phraseToSpeak = joinedBuffer
      phraseToSpeak = phraseToSpeak.replace(/\n/g, ' ').trim()
    } catch (e) {
      // this.logToFlaggedWords(`caught after wordify:${e}`)
    }

    // clear the buffer
    this.morseVoice.voiceBuffer = []

    return phraseToSpeak
  }

  doPause = (fullRewind: boolean, fromPauseButton: boolean, fromStopButton: boolean) => {
    console.log(`doPause called fullRewid:${fullRewind} fromPauseButton:${fromPauseButton} fromStopButton:${fromStopButton}`)
    if (fromStopButton) {
      if (this.doPlayTimeout) {
        clearTimeout(this.doPlayTimeout)
      }
    }

    if (fromPauseButton) {
      this.runningPlayMs(this.runningPlayMs() + (Date.now() - this.lastPartialPlayStart()))
      this.isPaused(!this.isPaused())
    } else {
      this.isPaused(false)
    }
    this.playerPlaying(false)
    this.morseWordPlayer.pause(() => {
      // we're here if a complete rawtext finished
      this.lastFullPlayTime(Date.now())
      // TODO make this more generic for any future "plugins"
      if (this.rss.rssPlayCallback) {
        this.rss.rssPlayCallback(false)
      }

      this.preSpaceUsed(false)
      if (this.loop() && !fromStopButton && !fromPauseButton) {
        // as if user pressed play again
        // shuffle before we loop again
        if (!this.loopnoshuffle()) {
          this.shuffleWords(true)
        }
        this.doPlay(false, true)
      }
    }, true)
    if (fullRewind) {
      this.fullRewind()
    }
    if (fromStopButton) {
      this.maxRevealedTrail(-1)
    }

    if (this.cardSpaceTimerHandle) {
      clearTimeout(this.cardSpaceTimerHandle)
      this.cardSpaceTimerHandle = 0
    }
  }

  inputFileChange = (element: any) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    const file = element.files[0]
    const fr = new FileReader()
    fr.onload = (data) => {
      this.setText(data.target!.result as string)
      // need to clear or else won't fire if use clears the text area
      // and then tries to reload the same again
      element.value = null
      // request to undo "apply" after file load
      this.lessons.selectedDisplay({})
    }
    fr.readAsText(file)
  }

  doDownload = async () => {
    let allWords = ''
    const words = this.words().map(w => w.displayWord.replace(/\n/g, ' '))
    words.forEach((word) => {
      allWords += allWords.length > 0 ? ' ' + word : word
    })

    const config = this.getMorseStringToWavBufferConfig(allWords)
    const wav = await this.morseWordPlayer.getWavAndSample(config)
    const ary = new Uint8Array(wav)
    const link = document.getElementById('downloadLink')!
    const blob = new Blob([ary], { type: 'audio/wav' });
    (link as any).href = URL.createObjectURL(blob);
    (link as any).download = 'morse.wav'
    link.dispatchEvent(new MouseEvent('click'))
  }

  dummy = () => {
    console.log('dummy')
  }

  changeSoundMaker = (data: any, event: any) => {
    this.morseWordPlayer.setSoundMaker(data.smoothing())
  }

  doClear = () => {
    // stop playing
    this.doPause(true, false, false)
    this.setText('')
  }

  doApply = (fromUserClick:boolean = false) => {
    if (this.lessons.customGroup()) {
      this.lessons.doCustomGroup()
    } else {
      // skip presets if user clicked, assume they wanted to change something
      this.lessons.setDisplaySelected(this.lessons.selectedDisplay(), fromUserClick)
    }
  }

  saveSettings = () => {
    MorseSettingsHandler.saveSettings(this)
  }

  settingsFileChange = (element: any) => {
    // thanks to https://newbedev.com/how-to-access-file-input-with-knockout-binding
    MorseSettingsHandler.settingsFileChange(element, this)
  }

  logoClick = () => {
    console.log('logo clicked')
    this.logoClickCount++
    if (this.logoClickCount % 4 === 0) {
      this.lessons.toggleQueryStringSettingsOn()
    }
  }

  toggleLoop = () => {
    if (!this.loop()) {
      this.loop(true)
    } else if (this.loopnoshuffle()) {
      this.loop(false)
      this.loopnoshuffle(false)
    } else {
      this.loopnoshuffle(true)
    }
  }
}
