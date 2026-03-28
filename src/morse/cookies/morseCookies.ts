import Cookies from 'js-cookie'
import licwDefaults from '../../configs/licwdefaults.json'
import { GeneralUtils } from '../utils/general'
import { CookieInfo } from './CookieInfo'
import { ICookieHandler } from './ICookieHandler'
import { SettingsChangeInfo } from '../settings/settingsChangeInfo'
import MorseSettingsHandler from '../settings/morseSettingsHandler'

export class MorseCookies {
  static registeredHandlers:ICookieHandler[] = []
  static registerHandler = (handler:ICookieHandler) => {
    MorseCookies.registeredHandlers.push(handler)
  }

  static loadCookiesOrDefaults = (settingsChangeInfo:SettingsChangeInfo) => {
    // load any existing cookie values
    const { lockoutCookieChanges, ctxt, custom, ignoreCookies, ifLoadSettings, keyBlacklist, afterSettingsChange } = settingsChangeInfo
    if (lockoutCookieChanges) {
      if (ctxt.allowSaveCookies() && settingsChangeInfo.isYourSettings) {
        ctxt.currentSerializedSettings = MorseSettingsHandler.getCurrentSerializedSettings(ctxt)
      }
      if (ctxt.lockoutSaveCookiesTimerHandle) {
        clearTimeout(ctxt.lockoutSaveCookiesTimerHandle)
      }
      ctxt.allowSaveCookies(false)
      ctxt.lockoutSaveCookiesTimerHandle = setTimeout(() => { ctxt.allowSaveCookies(true) }, 700)
    }

    // Read from localStorage, falling back to cookies for one-time migration
    const cks: Record<string, string> = {}
    const lsKeys = Object.keys(localStorage)
    const cookieKeys = Object.keys(Cookies.get())
    const allKeys = new Set([...lsKeys, ...cookieKeys])
    allKeys.forEach(k => {
      const val = localStorage.getItem(k) ?? Cookies.get(k)
      if (val !== undefined && val !== null) {
        cks[k] = val
        // migrate cookie value to localStorage so it won't need the fallback next time
        if (localStorage.getItem(k) === null && Cookies.get(k) !== undefined) {
          localStorage.setItem(k, val)
        }
      }
    })
    const cksKeys = Object.keys(cks)

    const settings = custom || licwDefaults.startupSettings
    const cookieFiltered = (ss: any[]) => {
      if (ignoreCookies) {
        return ss
      }
      // ignore setting for which there's a stored value
      return ss.filter((x: any) => cksKeys.indexOf(x.key) < 0)
    }

    const workAry = ifLoadSettings ? cookieFiltered(settings) : cksKeys
    const keyResolver = ifLoadSettings ? (x: any) => x.key : (x: any) => x
    const valResolver = ifLoadSettings ? (x: any) => x.value : (x: any) => cks[x]
    const specialHandling: CookieInfo[] = []
    const xtraspecialHandling: CookieInfo[] = []
    const otherHandling: CookieInfo[] = []
    if (workAry) {
      workAry.forEach((setting: any) => {
        const key = keyResolver(setting)
        if (!keyBlacklist.some((s: string) => s === key)) {
          let val = valResolver(setting)
          switch (key) {
            case 'syncWpm':
            case 'wpm':
            case 'fwpm':
            case 'syncFreq':
            case 'ditFrequency':
            case 'dahFrequency':
              xtraspecialHandling.push(<CookieInfo>{ key, val })
              break
            case 'numberOfRepeats':
              (ctxt as any)[key](parseInt(val))
              break
            default:
              if (typeof (ctxt as any)[key] !== 'undefined') {
                if (key === 'xtraWordSpaceDits' && parseInt(val) === 0) {
                  val = 1
                }
                (ctxt as any)[key](GeneralUtils.booleanize(val))
              } else {
                otherHandling.push(<CookieInfo>{ key, val })
              }
          }
        }
      })
      MorseCookies.registeredHandlers.forEach((handler) => {
        handler.handleCookies(xtraspecialHandling)
        handler.handleCookies(otherHandling)
      })
      specialHandling.forEach((x) => {
        console.log('in special handling');
        (ctxt as any)[x.key](x.val)
      })
    }
    if (afterSettingsChange) {
      afterSettingsChange()
    }
  }
}
