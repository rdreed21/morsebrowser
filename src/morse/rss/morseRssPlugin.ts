import { observable, Observable, computed, observableArray, ObservableArray } from '../utils/observable'
import { CookieInfo } from '../cookies/CookieInfo'
import { ICookieHandler } from '../cookies/ICookieHandler'
import { MorseCookies } from '../cookies/morseCookies'
import { RssConfig } from './RssConfig'
import { RssTitle } from './RssTitle'
export default class MorseRssPlugin implements ICookieHandler {
  rssConfig:RssConfig
  rssFeedUrl:Observable<string> = observable('https://moxie.foxnews.com/feedburner/latest.xml')
  proxydUrl:Observable<string> = observable('http://127.0.0.1:8085/')
  rssPlayMins:Observable<number> = observable(5)
  rssPollMins:Observable<number> = observable(5)
  rssCookieWhiteList = ['rssFeedUrl', 'proxydUrl', 'rssPlayMins', 'rssPollMins']
  rssTitlesQueue:ObservableArray<RssTitle> = observableArray()
  rssPlayOn:Observable<boolean> = observable(false)
  /** Epoch ms of last successful poll; `0` means never polled (first wait passes immediately). */
  lastRSSPoll:Observable<number> = observable(0)
  rssPlayTimerHandle: any = null
  rssPollTimerHandle: any = null
  rssMinsToWait:Observable<number> = observable(-1)
  rssPollMinsToWait:Observable<number> = observable(-1)
  rssPollingOn:Observable<boolean> = observable(false)
  rssPolling:Observable<boolean> = observable(false)
  rssPlayWaitingBadgeText:Observable<string> = observable('')
  rssEnabled:Observable<boolean> = observable(false)

  constructor (rssConfig:RssConfig) {
    MorseCookies.registerHandler(this)
    this.rssConfig = rssConfig
  }

  unreadRssCount:Observable<number> = computed(() => {
    const unread = this.rssTitlesQueue().filter(x => !x.played)
    return !unread ? 0 : unread.length
  }, [this.rssTitlesQueue])

  playRssButtonText:Observable<string> = computed(() => {
    const minsToWait = this.rssMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && this.rssPlayOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    this.rssPlayWaitingBadgeText(waitingText)
    return (this.rssPlayOn() ? 'Stop' : 'Play') + ' RSS (' + this.unreadRssCount() + ')' + waitingText
  }, [this.rssMinsToWait, this.rssPlayOn, this.unreadRssCount])

  pollRssButtonText:Observable<string> = computed(() => {
    const minsToWait = this.rssPollMinsToWait()
    let waitingText = ''
    if (minsToWait > 0 && this.rssPollingOn()) {
      waitingText = ' Waiting '
      if (minsToWait > 1) {
        waitingText += Math.round(minsToWait).toString() + ' min'
      } else {
        waitingText += Math.round(60 * minsToWait).toString() + ' sec'
      }
    }
    return (this.rssPollingOn() ? 'Polling' : 'Poll') + ' RSS' + waitingText
  }, [this.rssPollMinsToWait, this.rssPollingOn])

  rssPlayCallback = (ignoreWait:boolean) => {
    if (this.rssPlayOn()) {
      const msSince = Date.now() - this.rssConfig.lastFullPlayTime()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > this.rssPlayMins())
      if (!this.rssConfig.playerPlaying()) {
        if (enoughWait || ignoreWait) {
          this.rssMinsToWait(-1)
          if (this.unreadRssCount() > 0) {
            const target = this.rssTitlesQueue().find(x => !x.played)!
            const replacement = new RssTitle(target.title, true)
            this.rssTitlesQueue.replace(target, replacement)

            this.rssConfig.setText(target.title)
            this.rssConfig.fullRewind()
            this.rssConfig.doPlay(false, false)
          }
        } else {
          this.rssMinsToWait(this.rssPlayMins() - minSince)
        }
      }
      this.rssPlayTimerHandle = setTimeout(this.rssPlayCallback, 20 * 1000)
    }
  }

  doRSSReset = () => {
    this.rssTitlesQueue(this.rssTitlesQueue().map(x => {
      x.played = true
      return x
    }))
  }

  doRssPlay = () => {
    this.rssPlayOn(!this.rssPlayOn())
    if (this.rssPlayOn()) {
      this.rssPlayCallback(true)
    } else {
      if (this.rssPlayTimerHandle) {
        clearTimeout(this.rssPlayTimerHandle)
      }
    }
  }

  doRSSCallback = () => {
    if (this.rssPollingOn() && !this.rssPolling()) {
      const msSince = Date.now() - this.lastRSSPoll()
      const minSince = msSince / 1000 / 60
      const enoughWait = (minSince > this.rssPollMins())
      if (enoughWait) {
        this.rssPolling(true)
        this.rssPollMinsToWait(-1)
        import(/* webpackChunkName: "rss-parser" */ 'rss-parser').then(({ default: RSSParser }) => {
          const parser = new RSSParser()
          parser.parseURL(this.proxydUrl() + this.rssFeedUrl().toString(), (err, feed) => {
            if (err) {
              this.lastRSSPoll(Date.now())
              alert('rss error')
              this.rssPolling(false)
              throw err
            }
            feed.items.reverse().forEach((entry) => {
              if (!this.rssTitlesQueue().find(x => x.title === entry.title)) {
                this.rssTitlesQueue.push(new RssTitle(entry.title ?? '', false))
              }
            })
            this.lastRSSPoll(Date.now())
            this.rssPollMinsToWait(this.rssPollMins())
            this.rssPolling(false)
          })
        })
      } else {
        this.rssPollMinsToWait(this.rssPollMins() - minSince)
      }
    }

    if (this.rssPollingOn()) {
      this.rssPollTimerHandle = setTimeout(this.doRSSCallback, 15 * 1000)
    } else {
      if (this.rssPollTimerHandle) {
        clearTimeout(this.rssPollTimerHandle)
      }
    }
  }

  doRSS = () => {
    this.rssPollingOn(!this.rssPollingOn())
    if (this.rssPollingOn()) {
      this.doRSSCallback()
    } else {
      if (this.rssPollTimerHandle) {
        clearTimeout(this.rssPollTimerHandle)
      }
    }
  }

  // cookie handlers
  handleCookies = (cookies: Array<CookieInfo>) => {
    if (!cookies) {
      return
    }
    let target:CookieInfo | undefined = cookies.find(x => x.key === 'rssFeedUrl')
    if (target) {
      this.rssFeedUrl(target.val)
    }

    target = cookies.find(x => x.key === 'proxydUrl')
    if (target) {
      this.proxydUrl(target.val)
    }

    target = cookies.find(x => x.key === 'rssPlayMins')
    if (target) {
      this.rssPlayMins(parseInt(target.val))
    }

    target = cookies.find(x => x.key === 'rssPollMins')
    if (target) {
      this.rssPollMins(parseInt(target.val))
    }
  }

  handleCookie = (cookie: string) => {}
}
