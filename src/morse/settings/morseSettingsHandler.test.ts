import MorseSettingsHandler from './morseSettingsHandler'

/** Minimal MorseViewModel-shaped object for getCurrentSerializedSettings (no browser/audio). */
function makeSettingsExportVm () {
  return {
    settings: {
      speed: {
        wpm: () => 18,
        fwpm: () => 12,
        syncWpm: () => false,
        speedInterval: () => false,
        intervalTimingsText: () => 'a',
        intervalWpmText: () => 'b',
        intervalFwpmText: () => 'c'
      },
      misc: {
        newlineChunking: () => true,
        isMoreSettingsAccordionOpen: false
      }
    },
    xtraWordSpaceDits: () => 3,
    volume: () => 9,
    lessons: {
      stickySets: () => 'SOS',
      ifStickySets: () => true,
      autoCloseLessonAccordion: () => true,
      customGroup: () => 'grp',
      syncSize: () => false,
      ifOverrideMinMax: () => true,
      overrideMin: () => 4,
      overrideMax: () => 8
    },
    hideList: () => false,
    showRaw: () => true,
    showExpertSettings: () => true,
    morseVoice: {
      voiceEnabled: () => true,
      voiceSpelling: () => false,
      voiceThinkingTime: () => 1,
      voiceAfterThinkingTime: () => 2,
      voiceVolume: () => 5,
      voiceLastOnly: () => true,
      manualVoice: () => false,
      speakFirst: () => true,
      speakFirstAdditionalWordspaces: () => 2,
      voiceBufferMaxLength: () => 50
    },
    numberOfRepeats: () => 2,
    cardSpace: () => 7,
    isShuffled: () => true,
    shuffleIntraGroup: () => false
  } as unknown as import('../morse').MorseViewModel
}

describe('MorseSettingsHandler.getCurrentSerializedSettings', () => {
  it('returns morseSettings array with stable keys and current values', () => {
    const vm = makeSettingsExportVm()
    const { morseSettings } = MorseSettingsHandler.getCurrentSerializedSettings(vm)
    const byKey = Object.fromEntries(morseSettings.map(s => [s.key, s.value]))

    expect(byKey.wpm).toBe(18)
    expect(byKey.fwpm).toBe(12)
    expect(byKey.syncWpm).toBe(false)
    expect(byKey.volume).toBe(9)
    expect(byKey.stickySets).toBe('SOS')
    expect(byKey.ifStickySets).toBe(true)
    expect(byKey.keepLines).toBe(true)
    expect(byKey.miscSettingsAccordionOpen).toBe(false)
    expect(byKey.voiceEnabled).toBe(true)
    expect(byKey.isShuffledSet).toBe(true)
    expect(byKey.shuffleIntraGroup).toBe(false)

    const keys = morseSettings.map(s => s.key)
    expect(keys).toContain('wpm')
    expect(keys).toContain('fwpm')
    expect(keys).toContain('intervalTimingsText')
    expect(keys).toContain('voiceBufferMaxLength')
  })
})
