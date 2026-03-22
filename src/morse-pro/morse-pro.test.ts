/**
 * Tests for morse-pro.js — the core Morse encode/decode library.
 *
 * WHY THESE TESTS MATTER:
 * Every word the app plays as audio goes through text2morse() first.
 * If encoding breaks, nothing sounds right. These tests catch that instantly
 * without needing to run the app in a browser.
 *
 * The functions tested here are pure (no browser APIs, no DOM, no state) so
 * they run fast and reliably in Node.js.
 */

import { text2morse, morse2text, text2ditdah, looksLikeMorse } from './morse-pro.js'

// ─── text2morse ─────────────────────────────────────────────────────────────

describe('text2morse', () => {
  it('encodes a single letter', () => {
    const result = text2morse('A')
    expect(result.morse).toBe('.-')
    expect(result.message).toBe('A')
    expect(result.hasError).toBe(false)
  })

  it('encodes a full word (case-insensitive input)', () => {
    // Input is lower-case; the function upper-cases it internally
    const result = text2morse('hello')
    expect(result.morse).toBe('.... . .-.. .-.. ---')
    expect(result.message).toBe('HELLO')
    expect(result.hasError).toBe(false)
  })

  it('encodes SOS correctly', () => {
    const result = text2morse('SOS')
    expect(result.morse).toBe('... --- ...')
    expect(result.hasError).toBe(false)
  })

  it('returns empty values for empty input', () => {
    const result = text2morse('')
    expect(result.morse).toBe('')
    expect(result.message).toBe('')
    expect(result.hasError).toBe(false)
  })

  it('reports an error for untranslatable characters and marks them with #', () => {
    const result = text2morse('~')
    expect(result.hasError).toBe(true)
    expect(result.morse).toContain('#')
    expect(result.message).toContain('#')
  })

  it('encodes digits', () => {
    expect(text2morse('0').morse).toBe('-----')
    expect(text2morse('1').morse).toBe('.----')
    expect(text2morse('9').morse).toBe('----.')
  })

  it('encodes common punctuation', () => {
    expect(text2morse('.').morse).toBe('.-.-.-')
    expect(text2morse(',').morse).toBe('--..--')
    expect(text2morse('?').morse).toBe('..--..')
  })

  it('encodes prosigns when useProsigns=true (default)', () => {
    const ar = text2morse('<AR>')
    expect(ar.morse).toBe('.-.-.')
    expect(ar.hasError).toBe(false)

    const sk = text2morse('<SK>')
    expect(sk.morse).toBe('...-.-')
    expect(sk.hasError).toBe(false)

    const bt = text2morse('<BT>')
    expect(bt.morse).toBe('-...-')
    expect(bt.hasError).toBe(false)
  })

  it('treats prosigns as plain text when useProsigns=false', () => {
    // With prosigns disabled, <AR> is encoded character by character: < > A R
    const result = text2morse('<AR>', false)
    expect(result.hasError).toBe(true) // < and > are not in the basic dict
  })

  it('encodes a space as a word separator /', () => {
    const result = text2morse('E T')
    // E = '.', space = '/', T = '-'
    expect(result.morse).toBe('. / -')
  })
})

// ─── morse2text ─────────────────────────────────────────────────────────────

describe('morse2text', () => {
  it('decodes a single character', () => {
    const result = morse2text('.-')
    expect(result.message).toBe('A')
    expect(result.hasError).toBe(false)
  })

  it('decodes SOS', () => {
    const result = morse2text('... --- ...')
    expect(result.message).toBe('SOS')
    expect(result.hasError).toBe(false)
  })

  it('returns empty for empty input', () => {
    const result = morse2text('')
    expect(result.morse).toBe('')
    expect(result.message).toBe('')
    expect(result.hasError).toBe(false)
  })

  it('marks unknown morse sequences with #', () => {
    const result = morse2text('.-----.') // not in the lookup table
    expect(result.hasError).toBe(true)
    expect(result.message).toContain('#')
  })

  it('round-trips: text → morse → text', () => {
    const original = 'CQ DE W1AW'
    const encoded = text2morse(original)
    const decoded = morse2text(encoded.morse)
    expect(decoded.message).toBe(original)
  })
})

// ─── looksLikeMorse ─────────────────────────────────────────────────────────

describe('looksLikeMorse', () => {
  it('returns true for a valid morse string', () => {
    expect(looksLikeMorse('.- -..')).toBe(true)
  })

  it('returns true for a word-separated morse string', () => {
    expect(looksLikeMorse('... --- ... / -.. .   ...')).toBe(true)
  })

  it('returns true for a single word separator /', () => {
    expect(looksLikeMorse('/')).toBe(true)
  })

  it('returns false for plain text', () => {
    expect(looksLikeMorse('hello')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(looksLikeMorse('')).toBe(false)
  })

  it('returns false for mixed content', () => {
    expect(looksLikeMorse('hello .-')).toBe(false)
  })
})

// ─── text2ditdah ────────────────────────────────────────────────────────────

describe('text2ditdah', () => {
  it('converts E (single dit) to Dit.', () => {
    expect(text2ditdah('E')).toBe('Dit.')
  })

  it('converts T (single dah) to Dah.', () => {
    expect(text2ditdah('T')).toBe('Dah.')
  })

  it('converts A (.- ) to Di-dah.', () => {
    expect(text2ditdah('A')).toBe('Di-dah.')
  })

  it('returns a non-empty string for any translatable input', () => {
    expect(text2ditdah('SOS').length).toBeGreaterThan(0)
  })
})
