/**
 * Tests for ComputedTimes — converts unit multipliers into real millisecond values.
 *
 * WHY THESE TESTS MATTER:
 * ComputedTimes is what the audio player actually uses to schedule tones.
 * These tests verify that the arithmetic is correct: given known unit timings
 * and known character counts, the resulting milliseconds are exactly right.
 *
 * HOW IT WORKS:
 * MorseCountUnits holds counts: how many dits, dahs, spaces are in a morse string.
 * UnitTimingsAndMultipliers holds the ms-per-unit values.
 * ComputedTimes multiplies them together to get real audio scheduling times.
 */

import { ComputedTimes } from './ComputedTimes'
import { UnitTimingsAndMultipliers } from './UnitTimingsAndMultipliers'
import { MorseCountUnits } from './MorseCountUnits'

/** Helper: creates a clean MorseCountUnits with all zeros. */
function makeCountUnits(overrides: Partial<MorseCountUnits> = {}): MorseCountUnits {
  const c = new MorseCountUnits()
  Object.assign(c, overrides)
  return c
}

describe('ComputedTimes', () => {
  describe('basic arithmetic at 12 WPM (100ms per unit)', () => {
    // At 12 WPM with no Farnsworth: every unit = 100ms, dit = 100ms, dah = 300ms.
    const units = new UnitTimingsAndMultipliers(12, 12)

    it('calculates ditTime correctly (count × 1 × 100ms)', () => {
      const counts = makeCountUnits({ ditCount: 3 })
      const times = new ComputedTimes(units, counts)
      // 3 dits × 1 (multiplier) × 100ms = 300ms
      expect(times.ditTime).toBeCloseTo(300, 5)
    })

    it('calculates dahTime correctly (count × 3 × 100ms)', () => {
      const counts = makeCountUnits({ dahCount: 2 })
      const times = new ComputedTimes(units, counts)
      // 2 dahs × 3 (multiplier) × 100ms = 600ms
      expect(times.dahTime).toBeCloseTo(600, 5)
    })

    it('calculates intraCharacterSpaceTime correctly (count × 1 × 100ms)', () => {
      const counts = makeCountUnits({ intraCharacterSpaceCount: 4 })
      const times = new ComputedTimes(units, counts)
      // 4 spaces × 1 (multiplier) × 100ms = 400ms
      expect(times.intraCharacterSpaceTime).toBeCloseTo(400, 5)
    })

    it('calculates totalTime as the sum of all components', () => {
      // Simulate letter 'A' (.-): 1 dit, 1 dah, 1 intra-char space
      const counts = makeCountUnits({
        ditCount: 1,
        dahCount: 1,
        intraCharacterSpaceCount: 1,
      })
      const times = new ComputedTimes(units, counts)
      // 1×100 + 1×300 + 1×100 = 500ms
      expect(times.totalTime).toBeCloseTo(500, 5)
    })

    it('totalTime is zero when all counts are zero', () => {
      const counts = makeCountUnits()
      const times = new ComputedTimes(units, counts)
      expect(times.totalTime).toBe(0)
    })
  })

  describe('Farnsworth spacing — gaps stretch when FWPM < WPM', () => {
    // Characters play at 15 WPM, but inter-character and word gaps are stretched
    // to achieve an overall 8 WPM pace.
    const units = new UnitTimingsAndMultipliers(15, 8)

    it('interCharacterSpaceTime uses the stretched (FW) unit, not the character unit', () => {
      const counts = makeCountUnits({ interCharacterSpaceCount: 1 })
      const times = new ComputedTimes(units, counts)
      // Should be 3 × calculatedFWUnitsMs (not calculatedUnitsMs)
      const expected = 3 * units.calculatedFWUnitsMs
      expect(times.interCharacterSpaceTime).toBeCloseTo(expected, 5)
    })

    it('wordSpaceTime uses the stretched (FW) unit', () => {
      const counts = makeCountUnits({ wordSpacesCount: 1 })
      const times = new ComputedTimes(units, counts)
      // 7 × calculatedFWUnitsMs (no extra spacing in this test)
      const expected = 7 * units.calculatedFWUnitsMs
      expect(times.wordSpaceTime).toBeCloseTo(expected, 5)
    })

    it('ditTime still uses the regular (non-FW) unit', () => {
      const counts = makeCountUnits({ ditCount: 1 })
      const times = new ComputedTimes(units, counts)
      // dits always use calculatedUnitsMs — they are never Farnsworth stretched
      expect(times.ditTime).toBeCloseTo(units.calculatedUnitsMs, 5)
    })

    it('totalPlusTrail is greater than totalTime (adds one trailing word space)', () => {
      const counts = makeCountUnits({ ditCount: 5, dahCount: 2 })
      const times = new ComputedTimes(units, counts)
      expect(times.totalPlusTrail).toBeGreaterThan(times.totalTime)
    })
  })

  describe('extraWordSpacingDitsTime and singleWordSpaceTime', () => {
    // extraWordSpacingDitsCount lets callers add extra inter-word padding (in dit units).
    // singleWordSpaceTime is the time for one trailing word-space including any extra padding.
    // Both are computed at 12 WPM with no Farnsworth (100ms per unit).
    const units = new UnitTimingsAndMultipliers(12, 12)

    it('extraWordSpacingDitsTime is zero when extraWordSpacingDitsCount is 0', () => {
      const counts = makeCountUnits({ wordSpacesCount: 2 })
      // extraWordSpacingDitsCount defaults to 0
      const times = new ComputedTimes(units, counts)
      expect(times.extraWordSpacingDitsTime).toBe(0)
    })

    it('extraWordSpacingDitsTime scales with wordSpacesCount and extraWordSpacingDitsCount', () => {
      // 2 word spaces × 3 extra dits × 1 (ditMultiplier) × 100ms (FW unit) = 600ms
      const counts = makeCountUnits({ wordSpacesCount: 2, extraWordSpacingDitsCount: 3 })
      const times = new ComputedTimes(units, counts)
      expect(times.extraWordSpacingDitsTime).toBeCloseTo(600, 5)
    })

    it('extraWordSpacingDitsTime is included in totalTime', () => {
      const countsWithout = makeCountUnits({ wordSpacesCount: 1 })
      const countsWith    = makeCountUnits({ wordSpacesCount: 1, extraWordSpacingDitsCount: 5 })
      const without = new ComputedTimes(units, countsWithout)
      const with_   = new ComputedTimes(units, countsWith)
      expect(with_.totalTime).toBeGreaterThan(without.totalTime)
    })

    it('singleWordSpaceTime equals 7 FW units when extraWordSpacingDitsCount is 0', () => {
      // 7 (wordSpaceMultiplier) × 100ms (FW unit at 12/12 WPM) = 700ms
      const counts = makeCountUnits()
      const times = new ComputedTimes(units, counts)
      expect(times.singleWordSpaceTime).toBeCloseTo(700, 5)
    })

    it('singleWordSpaceTime grows with extraWordSpacingDitsCount', () => {
      const noExtra  = makeCountUnits({ extraWordSpacingDitsCount: 0 })
      const withExtra = makeCountUnits({ extraWordSpacingDitsCount: 4 })
      const t1 = new ComputedTimes(units, noExtra)
      const t2 = new ComputedTimes(units, withExtra)
      expect(t2.singleWordSpaceTime).toBeGreaterThan(t1.singleWordSpaceTime)
    })

    it('totalPlusTrail equals totalTime + singleWordSpaceTime', () => {
      const counts = makeCountUnits({ ditCount: 3, wordSpacesCount: 1, extraWordSpacingDitsCount: 2 })
      const times = new ComputedTimes(units, counts)
      expect(times.totalPlusTrail).toBeCloseTo(times.totalTime + times.singleWordSpaceTime, 5)
    })
  })
})
