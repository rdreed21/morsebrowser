import { MorseCookies } from '../cookies/morseCookies'
import { FrequencySettings } from './frequencySettings'
import { CookieInfo } from '../cookies/CookieInfo'

describe('FrequencySettings', () => {
  beforeEach(() => {
    MorseCookies.registeredHandlers.length = 0
  })

  it('syncFreq keeps dahFrequency in lockstep with ditFrequency on write', () => {
    const f = new FrequencySettings()
    f.syncFreq(true)
    f.ditFrequency(600)
    expect(f.trudDitFrequency()).toBe(600)
    expect(f.truDahFrequency()).toBe(600)
  })

  it('when syncFreq is off, dit and dah can differ', () => {
    const f = new FrequencySettings()
    f.syncFreq(false)
    f.ditFrequency(500)
    f.dahFrequency(550)
    expect(f.ditFrequency()).toBe(500)
    expect(f.dahFrequency()).toBe(550)
  })

  it('handleCookies applies syncFreq and frequencies', () => {
    const f = new FrequencySettings()
    const cookies: CookieInfo[] = [
      { key: 'syncFreq', val: 'false' },
      { key: 'ditFrequency', val: '432' },
      { key: 'dahFrequency', val: '678' },
    ]
    f.handleCookies(cookies)
    expect(f.syncFreq()).toBe(false)
    expect(f.ditFrequency()).toBe(432)
    expect(f.dahFrequency()).toBe(678)
  })

  it('turning syncFreq on after diverged frequencies snaps dahFrequency to ditFrequency', () => {
    const f = new FrequencySettings()
    // Start with sync off and different values
    f.syncFreq(false)
    f.ditFrequency(500)
    f.dahFrequency(650)
    expect(f.ditFrequency()).toBe(500)
    expect(f.dahFrequency()).toBe(650)

    // Enable sync — dahFrequency computed read path returns trudDitFrequency when synced
    f.syncFreq(true)
    expect(f.dahFrequency()).toBe(500)  // snapped to current dit frequency
  })
})
