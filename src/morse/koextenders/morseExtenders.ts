import * as ko from 'knockout'
import Cookies from 'js-cookie'
import { MorseViewModel } from '../morse'

export class MorseExtenders {
  static init = (ctxt:MorseViewModel) => {
    ko.extenders.saveCookie = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        if (ctxt.allowSaveCookies()) {
          Cookies.set(option, newValue, { expires: 365 })
        }
      })
      return target
    }

    ko.extenders.showingChange = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        if (ctxt.showRaw()) {
          ctxt.rawText(newValue)
        }
      })
      return target
    }
    ko.extenders.showRawChange = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        // console.log(option + ": " + newValue);
        if (newValue) {
          ctxt.showingText(ctxt.rawText())
        } else {
          ctxt.showingText('')
        }
      })
      return target
    }

    ko.extenders.setVolume = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        ctxt.morseWordPlayer.setVolume(newValue)
      })
      return target
    }

    ko.extenders.setNoiseVolume = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        ctxt.morseWordPlayer.setNoiseVolume(newValue)
      })
      return target
    }

    ko.extenders.setNoiseType = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        const config = ctxt.getMorseStringToWavBufferConfig('')
        config.noise.type = ctxt.noiseEnabled() ? newValue : 'off'
        ctxt.morseWordPlayer.setNoiseType(config)
      })
      return target
    }

    ko.extenders.undoIsShuffled = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        if (ctxt.isShuffled()) {
          // we are shuffled, but are we showing the correct text?
          // idea is that if something changes the text, it breaks out of shuffle
          if (ctxt.lastShuffled !== newValue) {
            ctxt.isShuffled(false)
          }
        }
      })
      return target
    }

    ko.extenders.dummyLogger = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        console.log(`dummyloggerextension option:${option} newValue:${newValue}`)
      })
      return target
    }

    ko.extenders.sWakeLock = (target: any, option: any) => {
      target.subscribe((newValue: any) => {
        if (newValue) {
          ctxt.screenWakeLock.activate()
        } else {
          ctxt.screenWakeLock.deactivate()
        }
      })
      return target
    }
  }

  static apply = (ctxt:MorseViewModel) => {
    ctxt.hideList.extend({ saveCookie: 'hideList' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.showingText.extend({ showingChange: 'showingChange' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.showRaw.extend({ showRawChange: 'showRawChange' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.preSpace.extend({ saveCookie: 'preSpace' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.xtraWordSpaceDits.extend({ saveCookie: 'xtraWordSpaceDits' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.volume.extend({ saveCookie: 'volume' } as ko.ObservableExtenderOptions<boolean>).extend({ setVolume: 'volume' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.noiseVolume.extend({ saveCookie: 'noiseVolume' } as ko.ObservableExtenderOptions<boolean>).extend({ setNoiseVolume: 'noiseVolume' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.noiseType.extend({ saveCookie: 'noiseType' } as ko.ObservableExtenderOptions<boolean>).extend({ setNoiseType: 'noiseType' } as ko.ObservableExtenderOptions<boolean>)

    // ctxt.rssEnabled.extend({ initRss: 'rssEnabled' })
    ctxt.showExpertSettings.extend({ saveCookie: 'showExpertSettings' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.cardFontPx.extend({ saveCookie: 'cardFontPx' } as ko.ObservableExtenderOptions<boolean>)

    ctxt.rawText.extend({ undoIsShuffled: 'rawText' } as ko.ObservableExtenderOptions<boolean>)
    ctxt.playerPlaying.extend({ sWakeLock: 'playerPlaying' } as ko.ObservableExtenderOptions<boolean>)
  }
}
