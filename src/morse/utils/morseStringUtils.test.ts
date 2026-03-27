/**
 * Tests for MorseStringUtils — string pre-processing and abbreviation expansion.
 *
 * WHY THESE TESTS MATTER:
 * Before any word is spoken aloud by text-to-speech, it passes through these
 * functions. If "QRM" doesn't expand to something speakable, the voice says
 * the letters robotically. If a Unicode character slips through, encoding crashes.
 *
 * These tests catch silent failures in the text pipeline without needing a browser.
 *
 * KEY CONCEPTS:
 *   doReplacements   — strips/replaces characters that Morse code can't handle
 *   wordifyPunctuation — expands abbreviations to speakable words for TTS
 *   getWords          — splits text into an array of WordInfo objects
 *
 * NOTE on wordifyPunctuation output format:
 *   The function wraps replacements with '|' as a separator token.
 *   For example, '.' becomes '|period|' not just 'period'.
 *   The '|' characters are handled downstream by the voice system.
 */

import MorseStringUtils from './morseStringUtils'

describe('MorseStringUtils.doReplacements', () => {
  it('replaces the slashed Ø with 0', () => {
    // Ø is a Unicode character used in some callsigns (e.g. OZ/OØ)
    expect(MorseStringUtils.doReplacements('Ø')).toBe('0')
  })

  it('removes curly apostrophes (not Morse-able)', () => {
    // "it's" with a curly apostrophe becomes "its"
    expect(MorseStringUtils.doReplacements('it\u2019s')).toBe('its')
  })

  it('removes straight apostrophes', () => {
    expect(MorseStringUtils.doReplacements("it's")).toBe('its')
  })

  it('replaces % with pct', () => {
    expect(MorseStringUtils.doReplacements('100%')).toBe('100pct')
  })

  it('leaves plain alphabetic text unchanged', () => {
    expect(MorseStringUtils.doReplacements('hello')).toBe('hello')
  })

  it('leaves morse-legal punctuation unchanged', () => {
    // These characters are in the Morse alphabet and should pass through
    expect(MorseStringUtils.doReplacements('.')).toBe('.')
    expect(MorseStringUtils.doReplacements(',')).toBe(',')
    expect(MorseStringUtils.doReplacements('?')).toBe('?')
    expect(MorseStringUtils.doReplacements('/')).toBe('/')
  })

  it('replaces unsupported symbols with a space', () => {
    // § is not in the Morse alphabet and not in the exception list
    const result = MorseStringUtils.doReplacements('§')
    expect(result).toBe(' ')
  })
})

describe('MorseStringUtils.wordifyPunctuation', () => {
  // The function wraps replacements in '|' — test with toContain() for clarity.

  it('expands . to "period"', () => {
    expect(MorseStringUtils.wordifyPunctuation('.')).toContain('period')
  })

  it('expands , to "comma"', () => {
    expect(MorseStringUtils.wordifyPunctuation(',')).toContain('comma')
  })

  it('expands ? to "question mark"', () => {
    expect(MorseStringUtils.wordifyPunctuation('?')).toContain('question mark')
  })

  it('expands / to "stroke"', () => {
    expect(MorseStringUtils.wordifyPunctuation('/')).toContain('stroke')
  })

  it('expands <AR> to "end of message"', () => {
    expect(MorseStringUtils.wordifyPunctuation('<AR>')).toContain('end of message')
  })

  it('expands <SK> to "end of contact"', () => {
    expect(MorseStringUtils.wordifyPunctuation('<SK>')).toContain('end of contact')
  })

  it('expands <BT> to "pause"', () => {
    expect(MorseStringUtils.wordifyPunctuation('<BT>')).toContain('pause')
  })

  it('leaves plain words unchanged', () => {
    // No wordification rules match plain alphabetic words
    expect(MorseStringUtils.wordifyPunctuation('hello')).toBe('hello')
  })

  it('with spellOverridesOnly=true, only expands punctuation marked overrideSpell', () => {
    // '.' has overrideSpell: true — it should still be expanded
    expect(MorseStringUtils.wordifyPunctuation('.', true)).toContain('period')
  })

  it('with spellOverridesOnly=true, does NOT expand prosigns (overrideSpell not set)', () => {
    // <AR> does not have overrideSpell:true — should NOT be expanded
    expect(MorseStringUtils.wordifyPunctuation('<AR>', true)).not.toContain('end of message')
  })
})

describe('MorseStringUtils.getWords', () => {
  it('splits a two-word string into 2 WordInfo items', () => {
    const words = MorseStringUtils.getWords('the cat', false)
    expect(words).toHaveLength(2)
  })

  it('returns 1 item for a single word', () => {
    const words = MorseStringUtils.getWords('hello', false)
    expect(words).toHaveLength(1)
  })

  it('filters out empty/whitespace-only entries', () => {
    const words = MorseStringUtils.getWords('  hello  ', false)
    expect(words).toHaveLength(1)
  })

  it('each item is a WordInfo with the correct displayWord', () => {
    const words = MorseStringUtils.getWords('fox', false)
    expect(words[0].displayWord).toBe('fox')
  })

  it('with newlineChunking=true, splits on newlines instead of spaces', () => {
    const words = MorseStringUtils.getWords('hello\nworld', true)
    expect(words).toHaveLength(2)
  })

  it('does not split override blocks on their internal spaces', () => {
    // The space inside {CQ|c q} should NOT create a new word
    const words = MorseStringUtils.getWords('{CQ|c q}', false)
    expect(words).toHaveLength(1)
  })
})

describe('MorseStringUtils.doReplacements — additional symbols', () => {
  it('normalizes curly apostrophe variants like observable tests', () => {
    expect(MorseStringUtils.doReplacements('a\u2018b')).toBe('ab')
  })

  it('preserves newlines for voice pipeline', () => {
    expect(MorseStringUtils.doReplacements('a\nb')).toBe('a\nb')
  })
})
