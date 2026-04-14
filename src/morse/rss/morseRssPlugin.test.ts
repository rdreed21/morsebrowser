import { describe, it, expect, vi } from 'vitest'
import MorseRssPlugin from './morseRssPlugin'
import { RssConfig } from './RssConfig'
import { RssTitle } from './RssTitle'
import { CookieInfo } from '../cookies/CookieInfo'

function makePlugin () {
  const setText = vi.fn()
  const fullRewind = vi.fn()
  const doPlay = vi.fn()
  const lastFullPlayTime = vi.fn(() => Date.now())
  const playerPlaying = vi.fn(() => false)
  const cfg = new RssConfig(setText, fullRewind, doPlay, lastFullPlayTime, playerPlaying)
  return { plugin: new MorseRssPlugin(cfg), setText, fullRewind, doPlay, lastFullPlayTime, playerPlaying }
}

describe('MorseRssPlugin', () => {
  it('applies rssFeedUrl and proxydUrl from handleCookies', () => {
    const { plugin } = makePlugin()
    const cookies: CookieInfo[] = [
      { key: 'rssFeedUrl', val: 'https://example.com/feed.xml' },
      { key: 'proxydUrl', val: 'http://localhost:9999/' }
    ]
    plugin.handleCookies(cookies)
    expect(plugin.rssFeedUrl()).toBe('https://example.com/feed.xml')
    expect(plugin.proxydUrl()).toBe('http://localhost:9999/')
  })

  it('applies poll and play interval cookies', () => {
    const { plugin } = makePlugin()
    plugin.handleCookies([
      { key: 'rssPollMins', val: '3' },
      { key: 'rssPlayMins', val: '7' }
    ])
    expect(plugin.rssPollMins()).toBe(3)
    expect(plugin.rssPlayMins()).toBe(7)
  })

  it('toggles rssPollingOn with doRSS', () => {
    const { plugin } = makePlugin()
    expect(plugin.rssPollingOn()).toBe(false)
    plugin.doRSS()
    expect(plugin.rssPollingOn()).toBe(true)
    plugin.doRSS()
    expect(plugin.rssPollingOn()).toBe(false)
  })

  it('counts unread titles', () => {
    const { plugin } = makePlugin()
    plugin.rssTitlesQueue.push(new RssTitle('a', false), new RssTitle('b', true))
    expect(plugin.unreadRssCount()).toBe(1)
  })

  it('doRSSReset marks every title played', () => {
    const { plugin } = makePlugin()
    plugin.rssTitlesQueue.push(new RssTitle('a', false), new RssTitle('b', false))
    expect(plugin.unreadRssCount()).toBe(2)
    plugin.doRSSReset()
    expect(plugin.unreadRssCount()).toBe(0)
  })

  it('doRssPlay toggles without touching the DOM', () => {
    const { plugin } = makePlugin()
    expect(() => {
      plugin.doRssPlay()
      plugin.doRssPlay()
    }).not.toThrow()
    expect(plugin.rssPlayOn()).toBe(false)
  })

  it('initializes lastRSSPoll to zero for first-poll semantics', () => {
    const { plugin } = makePlugin()
    expect(plugin.lastRSSPoll()).toBe(0)
  })
})
