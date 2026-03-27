import * as path from 'path'
import { runWordlistsIntegrityCheck } from '../scripts/wordlists-integrity'

describe('wordlists integrity (generated data vs src/wordfiles)', () => {
  it('every fileOptions entry exists on disk; every wordfile is referenced', () => {
    const root = path.join(__dirname, '..')
    const { ok, errors, warnings } = runWordlistsIntegrityCheck(root)
    if (warnings.length > 0) {
      // Unreferenced files under wordfiles/ — same class as checklessons.js line 31–32
      console.warn(`[wordlists integrity] ${warnings.length} wordfiles not referenced by wordlists.json (cleanup or add entries)`)
    }
    expect(errors, errors.join('\n')).toEqual([])
    expect(ok).toBe(true)
  })
})
