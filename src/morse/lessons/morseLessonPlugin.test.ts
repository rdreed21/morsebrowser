import { beforeEach, describe, expect, it, vi } from 'vitest'
import MorseLessonPlugin from './morseLessonPlugin'
import { CookieInfo } from '../cookies/CookieInfo'

vi.spyOn(console, 'log').mockImplementation(() => {})

const getMorseLessonFile = vi.fn()
vi.mock('../morseLessonFinder', () => ({
  MorseLessonFileFinder: { getMorseLessonFile: (...args: unknown[]) => getMorseLessonFile(...args) }
}))

vi.mock('../morsePresetFinder', () => ({
  MorsePresetFileFinder: { getMorsePresetFile: vi.fn() }
}))

vi.mock('../morsePresetSetFinder', () => ({
  MorsePresetSetFileFinder: { getMorsePresetSetFile: vi.fn() }
}))

function stubBrowserGlobals () {
  vi.stubGlobal('window', {
    location: { pathname: '/test', search: '' },
    history: { replaceState: vi.fn() }
  })
  vi.stubGlobal('document', {
    getElementById: vi.fn(() => null)
  })
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn()
  })
}

const fileOptionsFixture = [
  {
    sort: 1,
    userTarget: 'STUDENT',
    class: 'BC1',
    letterGroup: 'REA',
    newlineChunking: false,
    display: 'Lesson A',
    fileName: 'lessonA.txt'
  },
  {
    sort: 2,
    userTarget: 'STUDENT',
    class: 'BC1',
    letterGroup: 'REA',
    newlineChunking: false,
    display: 'Lesson B',
    fileName: 'lessonB.txt'
  },
  {
    sort: 3,
    userTarget: 'TEACHER',
    class: 'BC1',
    letterGroup: 'REA',
    newlineChunking: false,
    display: 'Lesson A',
    fileName: 'lessonA.txt'
  }
]

function mountPlugin () {
  stubBrowserGlobals()
  const setText = vi.fn()
  const getTimeEstimate = vi.fn(() => ({
    timeCalcs: { totalTime: 0 },
    timingUnits: { calculatedFWUnitsMs: 200, wordSpaceMultiplier: 7, ditUnitMultiPlier: 1 }
  }))
  const vm = {
    morseWordPlayer: { getTimeEstimate },
    cachedShuffle: false,
    shuffleWords: vi.fn(),
    currentSerializedSettings: null,
    numberOfRepeats: vi.fn(() => 0),
    cardSpace: vi.fn(() => 0),
    preSpace: vi.fn(() => 0),
    xtraWordSpaceDits: vi.fn(() => 1),
    trailReveal: vi.fn(() => false),
    trailPreDelay: vi.fn(() => 0),
    trailPostDelay: vi.fn(() => 0),
    morseVoice: {
      voiceEnabled: vi.fn(() => false),
      manualVoice: vi.fn(() => false),
      voiceThinkingTime: vi.fn(() => 0),
      speakFirstAdditionalWordspaces: vi.fn(() => 0)
    }
  }
  const morseSettings = {
    misc: { newlineChunking: vi.fn() }
  }
  const plugin = new MorseLessonPlugin(
    morseSettings as never,
    setText,
    getTimeEstimate,
    vm as never
  )
  plugin.wordLists(fileOptionsFixture as never[])
  return { plugin, setText, vm, morseSettings }
}

/**
 * Pick BC1 / REA / STUDENT. Computeds clear `selectedClass` / `letterGroup` and flip *_Initialized
 * flags; re-set flags after each step (same order as LessonsAccordion).
 */
function selectClassAndGroup (plugin: MorseLessonPlugin) {
  plugin.userTargetInitialized = true
  plugin.userTarget('STUDENT')
  plugin.selectedClassInitialized = true
  plugin.changeSelectedClass('BC1')
  plugin.letterGroupInitialized = true
  plugin.setLetterGroup('REA')
}

describe('MorseLessonPlugin', () => {
  beforeEach(() => {
    getMorseLessonFile.mockClear()
  })

  it('letterGroups prompts when class or user target is missing', () => {
    stubBrowserGlobals()
    const plugin = mountPlugin().plugin
    plugin.userTarget('')
    expect(plugin.letterGroups().some(s => s.includes('Select'))).toBe(true)
  })

  it('displays returns dummy row when letter group not chosen', () => {
    const { plugin } = mountPlugin()
    plugin.userTargetInitialized = true
    plugin.userTarget('STUDENT')
    plugin.selectedClassInitialized = true
    plugin.changeSelectedClass('BC1')
    plugin.letterGroup('')
    const d = plugin.displays()
    expect(d).toHaveLength(1)
    expect(d[0].isDummy).toBe(true)
  })

  it('syncNewlineChunkingFromSelectedLesson applies wordlist newlineChunking (Keep Lines)', () => {
    const { plugin, morseSettings } = mountPlugin()
    plugin.selectedDisplay({ display: 'L', fileName: 'f.txt', isDummy: false, newlineChunking: true })
    plugin.syncNewlineChunkingFromSelectedLesson()
    expect(morseSettings.misc.newlineChunking).toHaveBeenCalledWith(true)
    vi.mocked(morseSettings.misc.newlineChunking).mockClear()
    plugin.selectedDisplay({ display: 'L', fileName: 'f.txt', isDummy: false, newlineChunking: false })
    plugin.syncNewlineChunkingFromSelectedLesson()
    expect(morseSettings.misc.newlineChunking).toHaveBeenCalledWith(false)
  })

  it('setDisplaySelected loads word list when displays are initialized', () => {
    const { plugin, setText } = mountPlugin()
    selectClassAndGroup(plugin)
    plugin.displaysInitialized = true
    const real = plugin.displays().find((x: { isDummy?: boolean }) => !x.isDummy)
    expect(real).toBeTruthy()
    plugin.setDisplaySelected(real, true)
    expect(getMorseLessonFile).toHaveBeenCalledWith('lessonA.txt', expect.any(Function))
    expect(setText).not.toHaveBeenCalled()
    const afterFound = getMorseLessonFile.mock.calls[0][1] as (r: { found: boolean, data?: string }) => void
    afterFound({ found: true, data: 'HELLO' })
    expect(setText).toHaveBeenCalledWith('HELLO')
  })

  it('changeUserTarget updates target when initialized', () => {
    const { plugin } = mountPlugin()
    plugin.userTargetInitialized = true
    plugin.changeUserTarget('TEACHER')
    expect(plugin.userTarget()).toBe('TEACHER')
  })

  it('changeUserTarget resets selectedClass via the classes computed cascade', () => {
    // When userTarget changes the classes computed runs, which resets selectedClass('')
    // and sets selectedClassInitialized=false. This is the cascade that clears
    // downstream dropdowns (letter group, displays) when the user switches target.
    const { plugin } = mountPlugin()
    selectClassAndGroup(plugin)
    expect(plugin.selectedClass()).toBe('BC1')

    plugin.userTargetInitialized = true
    plugin.changeUserTarget('TEACHER')

    // The classes computed resets selectedClass when userTarget changes
    expect(plugin.selectedClass()).toBe('')
    // And the subsequent letterGroups computed resets letterGroup too
    expect(plugin.letterGroup()).toBe('')
  })

  it('displaysInitialized is not reset when displays recomputes after switching user target', () => {
    // Regression test for the bug fixed in this fork:
    // Previously, the `displays` computed set displaysInitialized=false on every
    // recompute. Once stuck at false, setDisplaySelected was permanently blocked.
    // Verify that displaysInitialized stays true across a user-target switch and
    // that setDisplaySelected can still load a word list after the round-trip.
    const { plugin } = mountPlugin()
    selectClassAndGroup(plugin)
    plugin.displaysInitialized = true

    // Trigger a displays recompute by switching user target away and back
    plugin.userTargetInitialized = true
    plugin.changeUserTarget('TEACHER')
    // displaysInitialized must NOT be wiped by the recompute
    expect(plugin.displaysInitialized).toBe(true)

    // Restore the selection path
    plugin.userTarget('STUDENT')
    plugin.selectedClassInitialized = true
    plugin.changeSelectedClass('BC1')
    plugin.letterGroupInitialized = true
    plugin.setLetterGroup('REA')

    const real = plugin.displays().find((x: { isDummy?: boolean }) => !x.isDummy)
    expect(real).toBeTruthy()

    // setDisplaySelected must still work — displaysInitialized was not cleared
    plugin.setDisplaySelected(real, true)
    expect(getMorseLessonFile).toHaveBeenCalledWith('lessonA.txt', expect.any(Function))
  })

  it('auto-selects single lesson when setDisplaysInitialized and exactly one match', () => {
    const single = fileOptionsFixture.filter(f => f.userTarget === 'STUDENT' && f.display === 'Lesson A')
    stubBrowserGlobals()
    const setText = vi.fn()
    const vm = { morseWordPlayer: { getTimeEstimate: () => ({ timeCalcs: { totalTime: 0 } }) }, cachedShuffle: false, shuffleWords: vi.fn(), currentSerializedSettings: null }
    const plugin = new MorseLessonPlugin({ misc: { newlineChunking: vi.fn() } } as never, setText, () => ({ timeCalcs: { totalTime: 0 } }), vm as never)
    plugin.wordLists(single as never[])
    plugin.userTargetInitialized = true
    plugin.userTarget('STUDENT')
    plugin.selectedClassInitialized = true
    plugin.changeSelectedClass('BC1')
    plugin.letterGroupInitialized = true
    plugin.setLetterGroup('REA')
    plugin.displaysInitialized = true
    plugin.setDisplaysInitialized()
    expect(plugin.selectedDisplay().fileName).toBe('lessonA.txt')
  })

  it('keeps override sizes valid and synced', () => {
    const { plugin } = mountPlugin()

    plugin.syncSize(false)
    plugin.overrideMin(5)
    expect(plugin.overrideMin()).toBe(5)
    expect(plugin.overrideMax()).toBe(5)

    plugin.overrideMax(4)
    expect(plugin.overrideMax()).toBe(5)

    plugin.overrideMax(7)
    expect(plugin.overrideMax()).toBe(7)

    plugin.overrideMin(0)
    expect(plugin.overrideMin()).toBe(5)
  })

  it('does not loop forever when override sizes are invalid', () => {
    const { plugin, setText } = mountPlugin()

    plugin.ifOverrideMinMax(true)
    plugin.trueOverrideMin(0)
    plugin.trueOverrideMax(0)
    plugin.randomWordList({ letters: 'ABC', practiceSeconds: 60, minWordSize: 1, maxWordSize: 3 }, false)

    expect(setText).toHaveBeenCalledWith('')
  })

  it('restores stickySets as text even when the saved value looks boolean-like', () => {
    const { plugin } = mountPlugin()

    plugin.handleCookies([{ key: 'stickySets', val: 'true' }] as CookieInfo[])

    expect(plugin.stickySets()).toBe('true')
  })
})
