import { describe, expect, it } from 'vitest'
import { MorsePresetFileFinder } from './morsePresetFinder'

describe('MorsePresetFileFinder', () => {
  it('resolves BC1_Default.json preset', async () => {
    const result = await new Promise<{ found: boolean, data?: { morseSettings: unknown[] } }>((resolve) => {
      MorsePresetFileFinder.getMorsePresetFile('BC1_Default.json', resolve)
    })
    expect(result.found).toBe(true)
    expect(Array.isArray(result.data?.morseSettings)).toBe(true)
  })

  it('returns found:false for unknown filename', async () => {
    const result = await new Promise<{ found: boolean }>((resolve) => {
      MorsePresetFileFinder.getMorsePresetFile('__definitely_missing__.json', resolve)
    })
    expect(result.found).toBe(false)
  })
})
