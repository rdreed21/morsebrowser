import { describe, it, expect } from 'vitest'
import { effectiveNoiseType } from './noisePlayback'

describe('effectiveNoiseType', () => {
  it('treats off as off', () => {
    expect(effectiveNoiseType('off')).toBe('off')
  })

  it('passes through white brown pink', () => {
    expect(effectiveNoiseType('white')).toBe('white')
    expect(effectiveNoiseType('brown')).toBe('brown')
    expect(effectiveNoiseType('pink')).toBe('pink')
  })

  it('rejects unknown values', () => {
    expect(effectiveNoiseType('')).toBe('off')
    expect(effectiveNoiseType('blue')).toBe('off')
  })
})
