import { observable, Observable, writableComputed } from '../utils/observable'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { GeneralUtils } from '../utils/general'
export class FrequencySettings implements ICookieHandler {
  trudDitFrequency:Observable<number>
  truDahFrequency:Observable<number>
  syncFreq:Observable<boolean>
  ditFrequency:Observable<number>
  dahFrequency:Observable<number>
  constructor () {
    MorseCookies.registerHandler(this)
    this.trudDitFrequency = observable(500)
    this.truDahFrequency = observable(500)
    this.syncFreq = observable(true)

    this.ditFrequency = writableComputed({
      read: () => {
        return this.trudDitFrequency()
      },
      write: (value) => {
        this.trudDitFrequency(value)
        if (this.syncFreq()) {
          this.truDahFrequency(value)
        }
      },
    }, [this.trudDitFrequency])

    this.dahFrequency = writableComputed({
      read: () => {
        if (!this.syncFreq()) {
          return this.truDahFrequency()
        } else {
          this.truDahFrequency(this.trudDitFrequency())
          return this.trudDitFrequency()
        }
      },
      write: (value) => {
        this.truDahFrequency(value)
      },
    }, [this.truDahFrequency, this.trudDitFrequency, this.syncFreq])
  }

  // cookie handlers
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo | undefined = cookies.find(x => x.key === 'syncFreq')
    if (target) {
      this.syncFreq(GeneralUtils.booleanize(target.val))
    }

    target = cookies.find(x => x.key === 'ditFrequency')
    if (target) {
      this.ditFrequency(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'dahFrequency')
    if (target) {
      this.dahFrequency(parseInt(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
