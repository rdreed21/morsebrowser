/**
 * Tests for WordInfo — parses words including the special override syntax.
 *
 * WHY THESE TESTS MATTER:
 * The app supports a special format for words: {display|spoken|groupId}
 * This lets a word display one thing on screen (e.g. "CQ") while speaking
 * something different via text-to-speech (e.g. "c q").
 *
 * WordInfo is used for every word in every lesson. If parsing breaks, the
 * wrong word plays, or TTS speaks the wrong thing, or group-shuffle breaks.
 *
 * SPECIAL SYNTAX EXPLAINED:
 *   "hello"           → plain word, display and speak "hello"
 *   "{CQ|c q}"        → display "CQ", speak "c q"
 *   "{73|seventy three|5}" → display "73", speak "seventy three", group ID 5
 */

import WordInfo from './wordInfo'

describe('WordInfo — plain words', () => {
  it('stores the raw word', () => {
    const w = new WordInfo('hello')
    expect(w.rawWord).toBe('hello')
  })

  it('displayWord returns the word as-is for plain text', () => {
    const w = new WordInfo('hello')
    expect(w.displayWord).toBe('hello')
  })

  it('speakText(false) returns the word for TTS (with trailing newline)', () => {
    const w = new WordInfo('hello')
    // speakText adds \n at the end (used by the voice system as a phrase delimiter)
    expect(w.speakText(false)).toContain('hello')
  })

  it('getGroupId returns null for a plain word', () => {
    const w = new WordInfo('hello')
    expect(w.getGroupId()).toBeNull()
  })

  it('splits a multi-word string into pieces', () => {
    const w = new WordInfo('the cat')
    expect(w.pieces).toHaveLength(2)
    expect(w.pieces[0]).toBe('the')
    expect(w.pieces[1]).toBe('cat')
  })

  it('displayWord joins pieces with a space', () => {
    const w = new WordInfo('the cat')
    expect(w.displayWord).toBe('the cat')
  })
})

describe('WordInfo — override syntax {display|speech}', () => {
  it('displayWord returns the display (left) part', () => {
    const w = new WordInfo('{CQ|c q}')
    expect(w.displayWord).toBe('CQ')
  })

  it('speakText(false) returns the speech (right) part', () => {
    const w = new WordInfo('{CQ|c q}')
    // Override speech is returned directly when not force-spelling
    expect(w.speakText(false)).toContain('c q')
  })

  it('speakText(true) spells out the display part letter by letter', () => {
    const w = new WordInfo('{CQ|c q}')
    // Force spelling of 'CQ' → 'C Q'
    expect(w.speakText(true)).toContain('C Q')
  })

  it('getGroupId returns null when no group ID is given', () => {
    const w = new WordInfo('{CQ|c q}')
    expect(w.getGroupId()).toBeNull()
  })
})

describe('WordInfo — override syntax {display|speech|groupId}', () => {
  it('parses the group ID as an integer', () => {
    const w = new WordInfo('{73|seventy three|5}')
    expect(w.getGroupId()).toBe(5)
  })

  it('displayWord returns the display part', () => {
    const w = new WordInfo('{73|seventy three|5}')
    expect(w.displayWord).toBe('73')
  })

  it('speakText(false) returns the speech part', () => {
    const w = new WordInfo('{73|seventy three|5}')
    expect(w.speakText(false)).toContain('seventy three')
  })

  it('handles negative group IDs', () => {
    const w = new WordInfo('{word|spoken|-3}')
    expect(w.getGroupId()).toBe(-3)
  })

  it('ignores non-integer group IDs (returns null)', () => {
    const w = new WordInfo('{word|spoken|abc}')
    expect(w.getGroupId()).toBeNull()
  })
})

describe('WordInfo — space handling inside overrides', () => {
  it('does not split on spaces that are inside curly braces', () => {
    // The space in "{CQ|c q}" should NOT split into separate pieces
    const w = new WordInfo('{CQ|c q}')
    expect(w.pieces).toHaveLength(1)
  })

  it('does split on spaces outside curly braces', () => {
    // "{CQ|c q} {DE|d e}" has a space between two override blocks
    const w = new WordInfo('{CQ|c q} {DE|d e}')
    expect(w.pieces).toHaveLength(2)
  })
})

describe('WordInfo — hasOverride helper', () => {
  it('returns true when the string contains {', () => {
    const w = new WordInfo('anything')
    expect(w.hasOverride('{CQ|c q}')).toBe(true)
  })

  it('returns false for plain text', () => {
    const w = new WordInfo('anything')
    expect(w.hasOverride('hello')).toBe(false)
  })
})

describe('WordInfo — getBracesIndex', () => {
  it('index 0 returns morse side of override', () => {
    const w = new WordInfo('x')
    expect(w.getBracesIndex('{CQ|c q}', 0)).toBe('CQ')
  })

  it('index 1 returns speech side', () => {
    const w = new WordInfo('x')
    expect(w.getBracesIndex('{CQ|c q}', 1)).toBe('c q')
  })

  it('index 2 returns empty string', () => {
    const w = new WordInfo('x')
    expect(w.getBracesIndex('{CQ|c q}', 2)).toBe('')
  })

  it('non-override string falls through to doReplacements', () => {
    const w = new WordInfo('x')
    expect(w.getBracesIndex('plain', 0)).toBe('plain')
  })
})

describe('WordInfo — speakText spelling path', () => {
  it('spells digits with e-workaround for TTS exponent quirk', () => {
    const w = new WordInfo('1e2')
    const out = w.speakText(true)
    expect(out).toContain('1,e,2')
  })

  it('override with speech only uses morse side when force spelling', () => {
    const w = new WordInfo('{AB|}')
    expect(w.speakText(true)).toMatch(/A\s+B/)
  })
})
