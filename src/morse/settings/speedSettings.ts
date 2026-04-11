import { observable, Observable, computed, writableComputed } from '../utils/observable'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { MorseViewModel } from '../morse'
import { GeneralUtils } from '../utils/general'
import { PlayingTimeInfo } from '../utils/playingTimeInfo'

export class ApplicableSpeed {
  wpm:number = 0
  fwpm:number = 0
  constructor (wpm:number, fwpm:number) {
    this.wpm = wpm
    this.fwpm = fwpm
  }
}
export default class SpeedSettings implements ICookieHandler {
  wpm: Observable<number>
  fwpm: Observable<number>
  trueWpm: Observable<number>
  trueFwpm: Observable<number>
  syncWpm: Observable<boolean>
  speedInterval:Observable<boolean>
  intervalTimingsText:Observable<string>
  intervalWpmText:Observable<string>
  intervalFwpmText:Observable<string>
  morseViewModel:MorseViewModel
  variableSpeedDisplay: Observable<boolean>
  vWpm: Observable<number>
  vFwpm: Observable<number>
  vm:MorseViewModel

  constructor (vm:MorseViewModel) {
    MorseCookies.registerHandler(this)
    this.vm = vm
    this.trueWpm = observable(12)
    this.trueFwpm = observable(12)
    this.syncWpm = observable(true)
    this.speedInterval = observable(false)
    this.intervalTimingsText = observable('')
    this.intervalWpmText = observable('')
    this.intervalFwpmText = observable('')
    this.vWpm = observable(0)
    this.vFwpm = observable(0)

    this.wpm = writableComputed({
      read: () => {
        return this.trueWpm()
      },
      write: (value:any) => {
        this.trueWpm(value)
        if (this.syncWpm() || parseInt(value) < parseInt(this.trueFwpm() as any)) {
          this.trueFwpm(value)
        }
      }
    }, [this.trueWpm])

    this.fwpm = writableComputed({
      read: () => {
        const fwpm = parseInt(this.trueFwpm() as any)
        const wpm = parseInt(this.trueWpm() as any)
        return this.syncWpm() ? wpm : Math.min(fwpm, wpm)
      },
      write: (value:any) => {
        if (parseInt(value) <= parseInt(this.trueWpm() as any)) {
          this.trueFwpm(value)
        }
      }
    }, [this.syncWpm, this.trueFwpm, this.trueWpm])

    // When sync is re-enabled, snap trueFwpm to the current trueWpm.
    this.syncWpm.subscribe((v: boolean) => {
      if (v) this.trueFwpm(this.trueWpm())
    })

    this.variableSpeedDisplay = computed(() => {
      return !!(this.speedInterval() && this.intervalTimingsText() && vm.playerPlaying())
    }, [this.speedInterval, this.intervalTimingsText, vm.playerPlaying])
  }

  getApplicableSpeed = (playingTimeInfo:PlayingTimeInfo) => {
    if (!this.speedInterval() || !this.intervalTimingsText()) {
      return new ApplicableSpeed(this.wpm(), this.fwpm())
    }

    const times = this.intervalTimingsText().split(',').map(x => parseFloat(x))
    let runningSum = 0
    const adjTimes = times.map(t => {
      runningSum += t
      return runningSum
    })
    const wpms = this.intervalWpmText().split(',').map(x => parseInt(x))
    const fwpms = this.intervalFwpmText().split(',').map(x => parseInt(x))
    let idx = -1
    adjTimes.forEach((t, i, ary) => {
      if (idx === -1 && playingTimeInfo.totalSeconds < t) {
        idx = i
      }
    })
    if (idx === -1) {
      idx = Math.max(wpms.length - 1, fwpms.length - 1)
    }

    const wpm = wpms.length - 1 >= idx ? wpms[idx] : wpms[wpms.length - 1]
    const fwpm = fwpms.length - 1 >= idx ? fwpms[idx] : fwpms[fwpms.length - 1]
    this.vWpm(wpm)
    this.vFwpm(fwpm)
    return new ApplicableSpeed(wpm, fwpm)
  }

  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo | undefined = cookies.find(x => x.key === 'syncWpm')
    if (target) {
      this.syncWpm(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'wpm')
    if (target) {
      this.wpm(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'fwpm')
    if (target) {
      this.fwpm(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'speedInterval')
    if (target) {
      this.speedInterval(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'intervalTimingsText')
    if (target) {
      this.intervalTimingsText(target.val)
    }

    target = cookies.find(x => x.key === 'intervalWpmText')
    if (target) {
      this.intervalWpmText(target.val)
    }

    target = cookies.find(x => x.key === 'intervalFwpmText')
    if (target) {
      this.intervalFwpmText(target.val)
    }
  }

  handleCookie = (cookie: string) => {}
}
