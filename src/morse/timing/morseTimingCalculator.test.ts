import MorseCWWave from '../../morse-pro/morse-pro-cw-wave'
import { MorseTimingCalculator } from './morseTimingCalculator'
import { MorseCountUnits } from './MorseCountUnits'
import { SoundMakerConfig } from '../player/soundmakers/SoundMakerConfig'
import { UnitTimingsAndMultipliers } from './UnitTimingsAndMultipliers'

describe('MorseTimingCalculator', () => {
  describe('getTimingUnits', () => {
    it('returns UnitTimingsAndMultipliers for wpm/fwpm', () => {
      const u = MorseTimingCalculator.getTimingUnits(18, 12)
      expect(u).toBeInstanceOf(UnitTimingsAndMultipliers)
      expect(u.calculatedUnitsMs).toBeGreaterThan(0)
    })
  })

  describe('countUnits', () => {
    it('counts dits, dahs, spaces for morse with slash word separators', () => {
      const wave = new MorseCWWave(true, 20, 20)
      wave.translate('A')
      const morseWithSlash = wave.morse.replace(/ /g, '/') // calculator splits words on /
      wave.morse = morseWithSlash

      const counts = MorseTimingCalculator.countUnits(wave, new MorseCountUnits())
      expect(counts.ditCount).toBe(1)
      expect(counts.dahCount).toBe(1)
      expect(counts.intraCharacterSpaceCount).toBe(1)
    })

    it('reuses prePopulated object when provided', () => {
      const wave = new MorseCWWave(true, 20, 20)
      wave.translate('E')
      wave.morse = wave.morse.replace(/ /g, '/')
      const pre = new MorseCountUnits()
      pre.ditCount = 99
      const out = MorseTimingCalculator.countUnits(wave, pre)
      expect(out).toBe(pre)
      expect(pre.ditCount).not.toBe(99)
    })
  })

  describe('getTimeLine', () => {
    it('returns [] when timing units are NaN', () => {
      const wave = new MorseCWWave(true, 20, 20)
      wave.translate('E')
      wave.morse = '.'
      const bad = {
        calculatedUnitsMs: NaN,
        calculatedFWUnitsMs: 100,
        intraCharacterSpaceMultiplier: 1,
        ditUnitMultiPlier: 1,
        dahUnitMultiplier: 3,
        interCharacterSpaceMultiplier: 3,
        wordSpaceMultiplier: 7,
      } as unknown as UnitTimingsAndMultipliers
      const cfg = new SoundMakerConfig()
      cfg.prePaddingMs = 0
      expect(MorseTimingCalculator.getTimeLine(wave, bad, cfg)).toEqual([])
    })

    it('emits prepad and dit events for a single dit', () => {
      const wave = new MorseCWWave(true, 12, 12)
      wave.morse = '.'
      const units = new UnitTimingsAndMultipliers(12, 12)
      const cfg = new SoundMakerConfig()
      cfg.prePaddingMs = 5
      const events = MorseTimingCalculator.getTimeLine(wave, units, cfg)
      const types = events.map(e => e.event)
      expect(types[0]).toBe('prepad_start')
      expect(types).toContain('dit_start')
      expect(types).toContain('dit_end')
      expect(events[events.length - 1].time).toBeGreaterThan(0)
    })
  })
})
