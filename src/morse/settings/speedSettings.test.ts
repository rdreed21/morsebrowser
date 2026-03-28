import { MorseCookies } from '../cookies/morseCookies'
import { observable } from '../utils/observable'
import SpeedSettings from './speedSettings'
import { PlayingTimeInfo } from '../utils/playingTimeInfo'
import { CookieInfo } from '../cookies/CookieInfo'

describe('SpeedSettings', () => {
  let vm: import('../morse').MorseViewModel

  beforeEach(() => {
    MorseCookies.registeredHandlers.length = 0
    vm = { playerPlaying: observable(false) } as import('../morse').MorseViewModel
  })

  it('syncWpm links fwpm to wpm on write', () => {
    const s = new SpeedSettings(vm)
    s.syncWpm(true)
    s.wpm(15)
    expect(s.trueWpm()).toBe(15)
    expect(s.trueFwpm()).toBe(15)
  })

  it('when syncWpm is off, fwpm can be set lower than wpm', () => {
    const s = new SpeedSettings(vm)
    s.syncWpm(false)
    s.wpm(20)
    s.fwpm(12)
    expect(s.wpm()).toBe(20)
    expect(s.fwpm()).toBe(12)
  })

  it('getApplicableSpeed returns base wpm/fwpm when interval is off', () => {
    const s = new SpeedSettings(vm)
    s.syncWpm(false)
    s.wpm(18)
    s.fwpm(12)
    s.speedInterval(false)
    const speed = s.getApplicableSpeed(new PlayingTimeInfo(0, 30))
    expect(speed.wpm).toBe(18)
    expect(speed.fwpm).toBe(12)
  })

  it('getApplicableSpeed picks interval row from elapsed seconds', () => {
    const s = new SpeedSettings(vm)
    s.speedInterval(true)
    s.intervalTimingsText('30,60')
    s.intervalWpmText('10,20')
    s.intervalFwpmText('10,20')
    const early = s.getApplicableSpeed(new PlayingTimeInfo(0, 10))
    expect(early.wpm).toBe(10)
    const later = s.getApplicableSpeed(new PlayingTimeInfo(0, 45))
    expect(later.wpm).toBe(20)
  })

  it('getApplicableSpeed clamps to last entry when elapsed time exceeds all intervals', () => {
    // Intervals: [30, 60] → cumulative [30, 90]. At 150s the loop never sets idx,
    // so idx stays -1 and the fallback uses the last array index.
    const s = new SpeedSettings(vm)
    s.speedInterval(true)
    s.intervalTimingsText('30,60')
    s.intervalWpmText('10,20')
    s.intervalFwpmText('10,20')
    const beyond = s.getApplicableSpeed(new PlayingTimeInfo(0, 150))
    expect(beyond.wpm).toBe(20)   // last defined speed
    expect(beyond.fwpm).toBe(20)
  })

  it('handleCookies applies wpm, fwpm, syncWpm from CookieInfo list', () => {
    const s = new SpeedSettings(vm)
    const cookies: CookieInfo[] = [
      { key: 'syncWpm', val: 'false' },
      { key: 'wpm', val: '22' },
      { key: 'fwpm', val: '11' },
    ]
    s.handleCookies(cookies)
    expect(s.syncWpm()).toBe(false)
    expect(s.wpm()).toBe(22)
    expect(s.fwpm()).toBe(11)
  })
})
