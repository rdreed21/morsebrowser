import { afterEach, beforeEach, vi } from 'vitest'
import WordInfo from '../utils/wordInfo'
import { FlaggedWords } from './flaggedWords'

describe('FlaggedWords', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clear empties the list and count', () => {
    const f = new FlaggedWords()
    f.flaggedWords('a b')
    f.clear()
    expect(f.flaggedWords()).toBe('')
    expect(f.flaggedWordsCount()).toBe(0)
  })

  it('addFlaggedWord appends first word without leading space', () => {
    const f = new FlaggedWords()
    f.addFlaggedWord(new WordInfo('CQ'))
    expect(f.flaggedWords()).toBe('CQ')
    expect(f.flaggedWordsCount()).toBe(1)
  })

  it('addFlaggedWord appends second word with space', () => {
    const f = new FlaggedWords()
    f.addFlaggedWord(new WordInfo('CQ'))
    vi.advanceTimersByTime(1000)
    f.addFlaggedWord(new WordInfo('DE'))
    expect(f.flaggedWords()).toBe('CQ DE')
    expect(f.flaggedWordsCount()).toBe(2)
  })

  it('double-click same word within threshold removes last occurrence', () => {
    const f = new FlaggedWords()
    f.addFlaggedWord(new WordInfo('TEST'))
    f.addFlaggedWord(new WordInfo('TEST'))
    expect(f.flaggedWords()).toBe('')
    expect(f.flaggedWordsCount()).toBe(0)
  })

  it('same word added after threshold (>500ms) appends instead of removing', () => {
    const f = new FlaggedWords()
    f.addFlaggedWord(new WordInfo('TEST'))
    vi.advanceTimersByTime(600)   // exceeds the 500ms double-click threshold
    f.addFlaggedWord(new WordInfo('TEST'))
    expect(f.flaggedWords()).toBe('TEST TEST')
    expect(f.flaggedWordsCount()).toBe(2)
  })
})
