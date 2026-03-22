/**
 * Tests for UnitTimingsAndMultipliers — the PARIS timing math.
 *
 * WHY THESE TESTS MATTER:
 * Morse code timing is based on the PARIS standard: the word "PARIS" takes
 * exactly 50 timing units, so 1 WPM = 1200ms per dit. Every audio tone played
 * by the app uses these numbers. If the math is wrong, all audio is wrong speed.
 *
 * These tests verify the formula and the fixed multipliers that define the
 * relationships between dits, dahs, and spaces.
 *
 * GLOSSARY (for non-programmers):
 *   WPM  = words per minute (overall speed)
 *   FWPM = Farnsworth WPM — character speed stays at WPM, but spaces between
 *          characters are stretched so the overall pace matches a slower speed.
 *          Used to help learners hear each character clearly while having more
 *          thinking time between them.
 *   dit  = a short morse element (dot) — 1 unit of time
 *   dah  = a long morse element (dash) — 3 units of time
 */

import { UnitTimingsAndMultipliers } from './UnitTimingsAndMultipliers'

describe('UnitTimingsAndMultipliers', () => {
  describe('calculatedUnitsMs — dit duration from WPM', () => {
    it('gives 100ms per dit at 12 WPM', () => {
      // Formula: (60 / (50 * wpm)) * 1000
      // = (60 / 600) * 1000 = 0.1 * 1000 = 100
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.calculatedUnitsMs).toBeCloseTo(100, 5)
    })

    it('gives 48ms per dit at 25 WPM', () => {
      // (60 / 1250) * 1000 = 48
      const u = new UnitTimingsAndMultipliers(25, 25)
      expect(u.calculatedUnitsMs).toBeCloseTo(48, 5)
    })

    it('gives 240ms per dit at 5 WPM', () => {
      // (60 / 250) * 1000 = 240
      const u = new UnitTimingsAndMultipliers(5, 5)
      expect(u.calculatedUnitsMs).toBeCloseTo(240, 5)
    })

    it('gives shorter dit at higher WPM (faster = shorter tones)', () => {
      const slow = new UnitTimingsAndMultipliers(5, 5)
      const fast = new UnitTimingsAndMultipliers(25, 25)
      expect(fast.calculatedUnitsMs).toBeLessThan(slow.calculatedUnitsMs)
    })
  })

  describe('calculatedFWUnitsMs — Farnsworth spacing duration', () => {
    it('equals calculatedUnitsMs when WPM equals FWPM (no Farnsworth stretch)', () => {
      // When WPM == FWPM, there's no Farnsworth effect: gaps play at full WPM speed.
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.calculatedFWUnitsMs).toBeCloseTo(u.calculatedUnitsMs, 5)
    })

    it('is larger than calculatedUnitsMs when FWPM < WPM (gaps are stretched)', () => {
      // Characters play at 15 WPM speed, but gaps are stretched to make the
      // overall pace feel like 10 WPM.
      const u = new UnitTimingsAndMultipliers(15, 10)
      expect(u.calculatedFWUnitsMs).toBeGreaterThan(u.calculatedUnitsMs)
    })

    it('increases as FWPM decreases for a fixed WPM', () => {
      // The slower the Farnsworth target, the longer the gaps.
      const u1 = new UnitTimingsAndMultipliers(20, 15) // mild stretch
      const u2 = new UnitTimingsAndMultipliers(20, 8)  // heavy stretch
      expect(u2.calculatedFWUnitsMs).toBeGreaterThan(u1.calculatedFWUnitsMs)
    })
  })

  describe('fixed multipliers', () => {
    it('dit multiplier is 1', () => {
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.ditUnitMultiPlier).toBe(1)
    })

    it('dah multiplier is 3 (dahs are 3× longer than dits)', () => {
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.dahUnitMultiplier).toBe(3)
    })

    it('intra-character space multiplier is 1 (gap between elements of one letter)', () => {
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.intraCharacterSpaceMultiplier).toBe(1)
    })

    it('inter-character space multiplier is 3 (gap between letters)', () => {
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.interCharacterSpaceMultiplier).toBe(3)
    })

    it('word space multiplier is 7 (gap between words)', () => {
      const u = new UnitTimingsAndMultipliers(12, 12)
      expect(u.wordSpaceMultiplier).toBe(7)
    })
  })
})
