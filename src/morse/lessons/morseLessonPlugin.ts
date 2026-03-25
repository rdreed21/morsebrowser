import { observable, Observable, computed, writableComputed, observableArray, ObservableArray } from '../utils/observable'
import WordListsJson from '../../wordfilesconfigs/wordlists.json'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { MorseLessonFileFinder } from '../morseLessonFinder'
import { MorseSettings } from '../settings/settings'
import { GeneralUtils } from '../utils/general'
import { FileOptionsInfo } from './FileOptionsInfo'
import ClassPresets from '../../presets/config.json'
import { MorsePresetSetFileFinder } from '../morsePresetSetFinder'
import { MorsePresetFileFinder } from '../morsePresetFinder'
import { MorseViewModel } from '../morse'
import { SettingsChangeInfo } from '../settings/settingsChangeInfo'
import SettingsOverridesJson from '../../presets/overrides/presetoverrides.json'
import { SettingsOption } from '../settings/settingsOption'
import MorseSettingsHandler from '../settings/morseSettingsHandler'
import LegacyMixinJson from '../../presets/legacymixin/legacymixin.json'
export default class MorseLessonPlugin implements ICookieHandler {
  autoCloseLessonAccordion:Observable<boolean>
  userTarget:Observable<string>
  selectedClass:Observable<string>
  userTargetInitialized:boolean
  selectedClassInitialized:boolean
  letterGroupInitialized:boolean
  displaysInitialized:boolean
  settingsPresetsInitialized:boolean
  letterGroup:Observable<string>
  selectedDisplay:Observable<any>
  wordLists:ObservableArray<FileOptionsInfo>
  morseSettings:MorseSettings
  setText:any
  ifStickySets:Observable<boolean>
  stickySets:Observable<string>
  randomizeLessons:Observable<boolean>
  ifOverrideTime:Observable<boolean>
  overrideMins:Observable<number>
  customGroup:Observable<string>
  ifOverrideMinMax:Observable<boolean>
  trueOverrideMin:Observable<number>
  trueOverrideMax:Observable<number>
  overrideMin:Observable<number>
  overrideMax:Observable<number>
  syncSize:Observable<boolean>
  getTimeEstimate:any
  classes:Observable<Array<any>>
  userTargets:Observable<Array<any>>
  letterGroups:Observable<Array<any>>
  displays:Observable<Array<any>>
  autoCloseCookieName:string
  settingsPresets:ObservableArray<SettingsOption>
  selectedSettingsPreset:Observable<SettingsOption>
  lastSelectedSettingsPreset:Observable<SettingsOption>
  settingsOverridden:Observable<boolean>
  morseViewModel:MorseViewModel
  yourSettingsDummy:SettingsOption
  customSettingsOptions:SettingsOption[] = []
  queryStringSettingsOn:boolean = false

  constructor (morseSettings:MorseSettings, setTextCallBack:any, timeEstimateCallback:any, morseViewModel:MorseViewModel) {
    MorseCookies.registerHandler(this)
    this.morseViewModel = morseViewModel
    this.yourSettingsDummy = { display: 'Your Settings', filename: 'dummy.json', isDummy: true }

    this.autoCloseCookieName = 'autoCloseLessonAccordian'
    this.morseSettings = morseSettings
    this.autoCloseLessonAccordion = observable(false)
    this.userTarget = observable('STUDENT')
    this.selectedClass = observable('')
    this.userTargetInitialized = false
    this.selectedClassInitialized = false
    this.letterGroupInitialized = false
    this.displaysInitialized = false
    this.letterGroup = observable('')
    this.selectedDisplay = observable({})
    this.selectedSettingsPreset = observable(this.yourSettingsDummy)
    this.lastSelectedSettingsPreset = observable(this.yourSettingsDummy)
    this.settingsOverridden = observable(false)
    this.wordLists = observableArray([])
    this.setText = setTextCallBack
    this.getTimeEstimate = timeEstimateCallback
    this.ifStickySets = observable(false)
    this.stickySets = observable('')
    this.randomizeLessons = observable(true)
    this.ifOverrideTime = observable(false)
    this.overrideMins = observable(2)
    this.customGroup = observable('')
    this.ifOverrideMinMax = observable(false)
    this.trueOverrideMin = observable(3)
    this.trueOverrideMax = observable(3)
    this.syncSize = observable(true)
    this.settingsPresets = observableArray([this.yourSettingsDummy])

    this.overrideMin = writableComputed({
      read: () => {
        return this.trueOverrideMin()
      },
      write: (value) => {
        this.trueOverrideMin(value)
        if (this.syncSize()) {
          this.trueOverrideMax(value)
        }
      },
    }, [this.trueOverrideMin])

    this.overrideMax = writableComputed({
      read: () => {
        if (!this.syncSize()) {
          return this.trueOverrideMax()
        } else {
          this.trueOverrideMax(this.trueOverrideMin())
          return this.trueOverrideMin()
        }
      },
      write: (value) => {
        if (value >= this.trueOverrideMin()) {
          this.trueOverrideMax(value)
        }
      },
    }, [this.trueOverrideMax, this.trueOverrideMin, this.syncSize])

    this.userTargets = computed(() => {
      const targs: any[] = []
      this.wordLists().forEach((x) => {
        if (!targs.find((y) => y === x.userTarget)) {
          targs.push(x.userTarget)
        }
      })
      return targs
    }, [this.wordLists])

    this.classes = computed(() => {
      this.selectedClassInitialized = false
      this.selectedClass('')
      const cls: any[] = []
      this.wordLists().forEach((x) => {
        if (!cls.find((y) => y === x.class) && x.userTarget === this.userTarget()) {
          cls.push(x.class)
        }
      })
      return cls
    }, [this.wordLists, this.userTarget])

    this.letterGroups = computed(() => {
      this.letterGroupInitialized = false
      this.letterGroup('')
      const lgs: any[] = []
      if (this.selectedClass() === '' || this.userTarget() === '') {
        const missing = []
        if (this.selectedClass() === '') {
          missing.push('class')
        }
        if (this.userTarget() === '') {
          missing.push('user')
        }
        return [`Select ${missing.join(', ')}`]
      }
      this.wordLists().filter((list) => list.class === this.selectedClass() && list.userTarget === this.userTarget())
        .forEach((x) => {
          if (!lgs.find((y) => y === x.letterGroup)) {
            lgs.push(x.letterGroup)
          }
        })
      return lgs
    }, [this.wordLists, this.selectedClass, this.userTarget])

    this.displays = computed(() => {
      this.selectedDisplay({})
      const dps: any[] = []
      if (this.selectedClass() === '' || this.userTarget() === '' || this.letterGroup() === '') {
        return [{ display: 'Select wordlist', fileName: 'dummy.txt', isDummy: true }]
      }
      this.wordLists().filter((list) => list.class === this.selectedClass() &&
             list.userTarget === this.userTarget() &&
             list.letterGroup === this.letterGroup())
        .forEach((x) => {
          if (!dps.find((y) => y === x.display)) {
            dps.push(x)
          }
        })
      return dps.length > 0 ? dps : [{ display: 'Select wordlist', fileName: 'dummy.txt', isDummy: true }]
    }, [this.wordLists, this.selectedClass, this.userTarget, this.letterGroup])

    // Fire getSettingsPresets whenever class or letter group changes
    this.selectedClass.subscribe(() => { this.getSettingsPresets(false, true) })
    this.letterGroup.subscribe(() => { this.getSettingsPresets(false, true) })
  }

  // end constructor

  // toggle queryStringSettingsOn
  toggleQueryStringSettingsOn = () => {
    console.log("toggling queryStringSettingsOn")
    this.queryStringSettingsOn = !this.queryStringSettingsOn
  }

  // helper function that takes a query string variable and its value and upserts into the query string with proper url encoding
  upsertQueryStringVariable = (variable:string, value:string):string => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const priority = ['selectedClass', 'selectedGroup', 'selectedLesson', 'selectedPreset']
    // if not toggleQueryStringSettingsOn, then do nothing
    if (!this.queryStringSettingsOn) {
      return urlParams.toString()
    }

    // if the variable and value are already set in the query string, do nothing
    if (urlParams.has(variable) && urlParams.get(variable) === value) {
      return urlParams.toString()
    }

    // if the variable is in the priority list, remove all other variables of lower priority, with "lower priority" being later in the order of the priority array
    const idx = priority.indexOf(variable as typeof priority[number]);
    if (idx !== -1) {
      // remove only lower-priority params (those that come later)
      for (let i = idx + 1; i < priority.length; i++) {
        urlParams.delete(priority[i]);
      }
    }

    if (urlParams.has(variable)) {
      urlParams.set(variable, value)
    } else {
      urlParams.append(variable, value)
    }
    // update the URL without reloading the page
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
    return urlParams.toString()
  }

  // given a query string variable, remove it from the querystring immediately in the window
  removeQueryStringVariable = (variable:string):string => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    if (urlParams.has(variable)) {
      urlParams.delete(variable)
      // update the URL without reloading the page
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
    }
    return urlParams.toString()
  }

  getSettingsPresets = (forceRefresh:boolean = false, selectFirstNonYour:boolean = false) => {
    let sps:SettingsOption[] = []
    sps.push(this.yourSettingsDummy)
    sps = sps.concat(this.customSettingsOptions)

    const handleAutoSelect = () => {
      if (selectFirstNonYour) {
        if (this.settingsPresets().length > 1) {
          if (this.selectedSettingsPreset().isDummy ||
          this.selectedSettingsPreset().filename !== this.settingsPresets()[1].filename) {
            this.setPresetSelected(this.settingsPresets()[1])
          }
        } else {
          this.setPresetSelected(this.settingsPresets()[0])
        }
      }
    }
    const handleData = (d: any) => {
      if (typeof d.data !== 'undefined' && typeof d.data.options !== 'undefined') {
        this.settingsPresets(sps.concat(d.data.options))
      } else {
        this.settingsPresets(sps)
        this.setPresetSelected(this.settingsPresets()[0])
      }
      handleAutoSelect()
    }

    if (this.selectedClass() === '') {
      // do nothing
      if (forceRefresh || this.selectedClass() === '') {
        this.settingsPresets(sps)
        this.setPresetSelected(this.settingsPresets()[0])
        handleAutoSelect()
      }
    } else {
      const targetClass = ClassPresets.classes.find(c => c.className === this.selectedClass())
      const letterGroupsGood = typeof targetClass !== 'undefined' &&
                               typeof targetClass.letterGroups !== 'undefined' &&
                               Array.isArray(targetClass.letterGroups) &&
                               targetClass.letterGroups.length > 0

      const targetLesson = letterGroupsGood ? targetClass.letterGroups.find(l => l.letterGroup === this.letterGroup()) : null
      if (targetLesson) {
        MorsePresetSetFileFinder.getMorsePresetSetFile(targetLesson.setFile, (data: any) => handleData(data))
      } else {
        if (targetClass && targetClass.defaultSetFile) {
          MorsePresetSetFileFinder.getMorsePresetSetFile(targetClass.defaultSetFile, (data: any) => handleData(data))
        } else {
          // no matches so use default
          this.settingsPresets(sps)
          handleAutoSelect()
        }
      }
    }
  }

  doCustomGroup = () => {
    if (this.customGroup()) {
      const data = { letters: this.customGroup().trim().replace(/ /g, '') }
      this.randomWordList(data, true)
      this.closeLessonAccordianIfAutoClosing()
    }
  }

  randomWordList = (data: any, ifCustom: any) => {
    let str = ''
    const splitWithProsignsAndStcikys = (s: string) => {
      let stickys = ''
      if (this.ifStickySets() && this.stickySets().trim()) {
        stickys = '|' + this.stickySets().toUpperCase().trim().replace(/ {2}/g, ' ').replace(/ /g, '|')
      }

      const regStr = `<.*?>${stickys}|[^<.*?>]|\\W`
      const re = new RegExp(regStr, 'g')
      const match = s.toUpperCase().match(re)
      return match
    }
    const chars = splitWithProsignsAndStcikys(data.letters) || []
    let seconds = 0
    const controlTime = (this.ifOverrideTime() || ifCustom) ? (this.overrideMins() * 60) : data.practiceSeconds
    const minWordSize = (this.ifOverrideMinMax() || ifCustom) ? this.overrideMin() : data.minWordSize
    const maxWordSize = (this.ifOverrideMinMax() || ifCustom) ? this.overrideMax() : data.maxWordSize
    const randomNumber = (min: number, max: number) => {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    do {
      let word = ''

      const getWordLength = (str:string):number => {
        let count:number = 0
        let insideSquareBrackets:boolean = false

        for (let i = 0; i < str.length; i++) {
          if (str[i] === '<') {
            insideSquareBrackets = true
            count++ // prosign counts as 1
          } else if (str[i] === '>') {
            insideSquareBrackets = false
          } else if (!insideSquareBrackets) {
            count++
          }
        }

        return count
      }
      if (this.randomizeLessons()) {
        // determine word length
        const wordLength = minWordSize === maxWordSize ? minWordSize : randomNumber(minWordSize, maxWordSize)

        for (let j = 1; j <= wordLength; j++) { // for each letter
          if (getWordLength(word) < wordLength) {
            const currentWordLength = getWordLength(word)
            const freeSpaces = wordLength - currentWordLength
            const usableChars = chars.filter((x: any) => x.length === 1 ||
              (x.startsWith('<') && x.endsWith('>')) || // prosigns counts as 1
              x.length <= freeSpaces
            )

            const selectedChars:string = usableChars[randomNumber(1, usableChars.length) - 1]
            console.log(`selectedChars=${selectedChars}`)
            word += selectedChars
          }
        }
      } else {
        word = data.letters
      }

      str += seconds > 0 ? (' ' + word.toUpperCase()) : word.toUpperCase()

      const est = this.getTimeEstimate(str)
      seconds = est.timeCalcs.totalTime / 1000
    } while (seconds < controlTime)

    this.setText(str)
  }

  getWordList = (filename: string) => {
    if (filename) {
      const isText = filename.endsWith('txt')

      const afterFound = (result: any) => {
        if (result.found) {
          if (isText) {
            this.setText(result.data)
          } else {
            this.randomWordList(result.data, false)
          }
          if (this.morseViewModel.cachedShuffle) {
            this.morseViewModel.shuffleWords()
            this.morseViewModel.cachedShuffle = false
          }
        } else {
          this.setText(`ERROR: Couldn't find ${filename} or it lacks .txt or .json extension.`)
        }
      }

      MorseLessonFileFinder.getMorseLessonFile(filename, afterFound)
    }
  }

  setUserTargetInitialized = () => {
    this.userTargetInitialized = true
  }

  setSelectedClassInitialized = () => {
    this.selectedClassInitialized = true
    // check for class preset
    const selectedClassParam = GeneralUtils.getParameterByName('selectedClass')
    if (selectedClassParam) {
      const paramClass = selectedClassParam.toUpperCase()
      const targetClass = this.classes().find(c => c.toUpperCase() === paramClass)
      if (targetClass) {
        this.changeSelectedClass(targetClass)
        if (!this.queryStringSettingsOn) {
          // remove selectedClass from the Querystring now that we're done
          this.removeQueryStringVariable('selectedClass')
        }
      }
    }

  }

  setLetterGroupInitialized = () => {
    this.letterGroupInitialized = true
    // check for class preset
    const selectedGroupParam = GeneralUtils.getParameterByName('selectedGroup')
    if (selectedGroupParam) {
      const paramClass = selectedGroupParam.toUpperCase()
      const targetClass = this.letterGroups().find(c => c.toUpperCase() === paramClass)
      if (targetClass) {
        this.setLetterGroup(targetClass)
        if (!this.queryStringSettingsOn) {
          // remove selectedGroup from the Querystring now that we're done
          this.removeQueryStringVariable('selectedGroup')
        }
      }
    }
  }

  setDisplaysInitialized = () => {
    this.displaysInitialized = true
    // check for 'displays' lesson preset
    const selectedLessonParam = GeneralUtils.getParameterByName('selectedLesson')
    if (selectedLessonParam) {
      const paramClass = selectedLessonParam.toUpperCase()
      const targetClass = this.displays().find(c => c.display.toUpperCase() === paramClass)
      var skipPresets = false
      if (GeneralUtils.getParameterByName('selectedPreset')) {
        skipPresets = true
      }
      if (targetClass) {
        this.setDisplaySelected(targetClass, skipPresets)
        if (!this.queryStringSettingsOn) {
          // remove selectedLesson from the Querystring now that we're done
          this.removeQueryStringVariable('selectedLesson')
        }
      }
    } else {
      // Auto-select the lesson when only one non-dummy option is available
      const nonDummy = this.displays().filter(d => !d.isDummy)
      if (nonDummy.length === 1) {
        this.setDisplaySelected(nonDummy[0])
      }
    }
  }

  setSettingsPresetsInitialized = () => {
    this.settingsPresetsInitialized = true
    const selectedPresetParam = GeneralUtils.getParameterByName('selectedPreset')
    if (selectedPresetParam) {
      const paramClass = selectedPresetParam.toUpperCase()
      const targetClass = this.settingsPresets().find(c => c.display.toUpperCase() === paramClass)
      if (targetClass) {
        this.setPresetSelected(targetClass)
        if (!this.queryStringSettingsOn) {
          setTimeout(() => {
            this.removeQueryStringVariable('selectedPreset')
          }, 1000)
        }
      } else {
        console.log('no preset found')
      }
    }
  }

  changeUserTarget = (userTarget: any) => {
    if (this.userTargetInitialized) {
      this.userTarget(userTarget)
      this.setPresetSelected(this.selectedSettingsPreset(), true)
    }
  }

  changeSelectedClass = (selectedClass: any, fromClick = "") => {
    if (this.selectedClassInitialized) {
      this.selectedClass(selectedClass)
      this.setPresetSelected(this.selectedSettingsPreset(), true)
      this.upsertQueryStringVariable('selectedClass', selectedClass)
    }
  }

  setLetterGroup = (letterGroup: any, fromClick="") => {
    if (this.letterGroupInitialized) {
      this.letterGroup(letterGroup)
      this.setPresetSelected(this.selectedSettingsPreset(), true)
      this.upsertQueryStringVariable('selectedGroup', letterGroup)
      // Auto-select lesson if there is exactly one option and none currently selected.
      if (!this.selectedDisplay().display) {
        const nonDummy = this.displays().filter((d: any) => !d.isDummy)
        if (nonDummy.length === 1) {
          this.setDisplaySelected(nonDummy[0])
        }
      }
    }
  }

  closeLessonAccordianIfAutoClosing = () => {
    if (this.autoCloseLessonAccordion()) {
      const elem = document.getElementById('lessonAccordianButton')
      elem?.click()
    }
  }

  setDisplaySelected = (display: any, skipPresets = false, fromClick="") => {
    if (!display.isDummy) {
      if (this.displaysInitialized) {
        this.selectedDisplay(display)
        this.upsertQueryStringVariable('selectedLesson', display.display)
        this.morseSettings.misc.newlineChunking(display.newlineChunking)
        this.getWordList(this.selectedDisplay().fileName)
        this.closeLessonAccordianIfAutoClosing()
        if (!skipPresets) {
          this.setPresetSelected(this.selectedSettingsPreset(), true)
        }
      }
    }
  }

  setPresetSelected = (preset:SettingsOption, skipReinit = false, fromClick="") => {
    // if the query string has selectedPreset, only proceed if that value equals preset.display
    const qsPreset = GeneralUtils.getParameterByName('selectedPreset')
    if (!(fromClick==='click') && qsPreset && qsPreset.toUpperCase() !== preset.display.toUpperCase()) {
      console.log(`skipping preset selection as query string preset is ${qsPreset}`)
      return
    }
    if (fromClick==='click') {
      this.removeQueryStringVariable('selectedPreset')
    }
    console.log(`setPresetSelected:${preset.display}`)
    if (this.settingsPresetsInitialized) {
      const last = this.lastSelectedSettingsPreset()
      if (typeof last.isDummy !== 'undefined' && last.isDummy && !this.settingsOverridden()) {
        this.morseViewModel.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(this.morseViewModel)
      }

      this.selectedSettingsPreset(preset)
      const settingsInfo = new SettingsChangeInfo(this.morseViewModel)
      settingsInfo.ifLoadSettings = true
      settingsInfo.ignoreCookies = true
      settingsInfo.lockoutCookieChanges = true
      settingsInfo.keyBlacklist = ['ditFrequency', 'dahFrequency', 'syncFreq', 'cardFontPx', 'preSpace', 'volume', 'voiceVolume']

      const applyLegacyMixin = () => {
        if (!LegacyMixinJson || !LegacyMixinJson.morseSettings) return
        const existingKeys = new Set(settingsInfo.custom!.map(s => s.key))
        LegacyMixinJson.morseSettings.forEach(s => {
          if (!existingKeys.has(s.key)) {
            settingsInfo.custom!.push({ key: s.key, value: s.value })
          }
        })
      }

      const applyOverrides = () => {
        /* make a copy as it seems some caching may be happening */
        const customCopy: any[] = []
        settingsInfo.custom!.forEach(f => {
          customCopy.push({ key: f.key, value: f.value })
        })
        settingsInfo.custom = customCopy
        SettingsOverridesJson.overrides.forEach(o => {
          if (
            (o.filters.letterGroup.some(s => s === this.letterGroup())) ||
            (this.selectedDisplay() && o.filters.fileName.some(s => s === this.selectedDisplay().fileName))
          ) {
            this.settingsOverridden(true)
            o.settings.forEach(f => {
              const target = settingsInfo.custom!.find(t => t.key === f.name)
              if (target) {
                target.value = f.value
              } else {
                settingsInfo.custom!.push({ key: f.name, value: f.value })
              }
            })
          } else {
            this.settingsOverridden(false)
          }
        })
      }

      if (typeof preset.isDummy !== 'undefined' && preset.isDummy) {
        if (this.morseViewModel.currentSerializedSettings) {
          settingsInfo.custom = this.morseViewModel.currentSerializedSettings.morseSettings
            .map((m: any) => {
              return { key: m.key, value: m.value }
            })

          applyLegacyMixin()
          applyOverrides()
          MorseCookies.loadCookiesOrDefaults(settingsInfo)
        } else {
          this.morseViewModel.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(this.morseViewModel)
        }
      } else {
        if (!preset.isCustom) {
          MorsePresetFileFinder.getMorsePresetFile(preset.filename, (d: any) => {
            if (d.found) {
              settingsInfo.custom = d.data.morseSettings.filter((f: any) => f.key !== 'showRaw')

              applyLegacyMixin()
              applyOverrides()
              MorseCookies.loadCookiesOrDefaults(settingsInfo)
            }
          })
        } else {
          // the settings are just attached to the option
          settingsInfo.custom = preset.morseSettings.filter((f: any) => f.key !== 'showRaw')

          applyLegacyMixin()
          applyOverrides()
          MorseCookies.loadCookiesOrDefaults(settingsInfo)
        }
      }

      // give time for settings to change, then re-init the lesson
      if (!skipReinit) {
        if (this.morseViewModel.lessons.selectedDisplay() && this.morseViewModel.lessons.selectedDisplay().display && !this.morseViewModel.lessons.selectedDisplay().isDummy) {
          setTimeout(() => { this.morseViewModel.lessons.setDisplaySelected(this.morseViewModel.lessons.selectedDisplay(), true) }
            , 1000)
        }
      }

      this.lastSelectedSettingsPreset(preset)
      this.upsertQueryStringVariable('selectedPreset', preset.display)
    }
  }

  initializeWordList = () => {
    this.wordLists(WordListsJson.fileOptions)
  }

  // cookie handling
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo | undefined = cookies.find(x => x.key === this.autoCloseCookieName)
    if (target) {
      this.autoCloseLessonAccordion(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'stickySets')
    if (target) {
      this.stickySets(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'ifStickySets')
    if (target) {
      this.ifStickySets(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'customGroup')
    if (target) {
      this.customGroup(target.val)
    }
    target = cookies.find(x => x.key === 'overrideSize')
    if (target) {
      this.ifOverrideMinMax(GeneralUtils.booleanize(target.val))
    }
    target = cookies.find(x => x.key === 'overrideSizeMin')
    if (target) {
      this.overrideMin(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'overrideSizeMax')
    if (target) {
      this.overrideMax(target.val as unknown as number)
    }
    target = cookies.find(x => x.key === 'syncSize')
    if (target) {
      this.syncSize(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'shuffleIntraGroup')
    if (target) {
      this.morseViewModel.shuffleIntraGroup(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'isShuffledSet')
    if (target) {
      console.log(`found isShuffled cookie:${target.val}`)
      if (GeneralUtils.booleanize(target.val)) {
        this.morseViewModel.cachedShuffle = true
      }
    }
  }

  handleCookie = (cookie: string) => {}
}
