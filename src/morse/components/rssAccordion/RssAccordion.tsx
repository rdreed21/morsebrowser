import { useState } from 'react'
import { useMorse } from '../../context/MorseContext'

export function RssAccordion () {
  const [isOpen, setIsOpen] = useState(false)
  const { vm, rss, morseLoadImages } = useMorse()
  const rssImageSrc = morseLoadImages?.getSrc('rssImage') ?? ''
  const hourglassImageSrc = morseLoadImages?.getSrc('hourglassImage') ?? ''

  return (
    <>
      <h2 className="accordion-header" id="headingOne">
        <button
          className={`accordion-button${isOpen ? '' : ' collapsed'}`}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="collapseOne"
          id="btnRssAccordionButton"
          onClick={() => setIsOpen(o => !o)}
        >
          <span>
            <img src={rssImageSrc} height={20} width={20} alt="" />&nbsp;RSS
            (Experimental, and you will need a proxy)
            <span>&nbsp;</span>
            <span className={`badge ${rss.rssPollingOn ? 'bg-success' : 'bg-danger'}`}>
              {rss.rssPollingOn ? rss.pollRssButtonText : 'No Polling'}
            </span>
            <span className="badge bg-success">Unread:&nbsp;{rss.unreadRssCount}</span>
            <span className={`badge ${rss.rssPlayOn ? 'bg-success' : 'bg-danger'}`}>
              {rss.rssPlayOn
                ? (rss.rssPlayWaitingBadgeText || 'Playing...')
                : 'Play Off'}
            </span>
          </span>
        </button>
      </h2>
      <div id="collapseOne" className={`accordion-collapse${isOpen ? ' show' : ' collapse'}`} aria-labelledby="headingOne">
        <div className="accordion-body">
          <div className="row row-cols-3 gy-2 gx-2">
            <div className="col-auto">
              <div className="input-group-vertical">
                <span className="input-group-text">RSS Url</span>
                <input type="text" className="form-control" aria-label="RSS" style={{ width: 300 }}
                  value={rss.rssFeedUrl} onChange={e => vm.rss.rssFeedUrl(e.target.value)} />
                <span className="input-group-text">Proxy Url</span>
                <input type="text" className="form-control" aria-label="Proxy"
                  value={rss.proxydUrl} onChange={e => vm.rss.proxydUrl(e.target.value)} />
              </div>
            </div>
            <div className="col-auto" style={{ width: 75 }}>
              <div className="input-group-vertical">
                <span className="input-group-text">
                  Poll&nbsp;<img src={hourglassImageSrc} height={15} width={15} alt="" />
                </span>
                <input type="number" className="form-control" aria-label="Poll"
                  value={rss.rssPollMins} onChange={e => vm.rss.rssPollMins(Number(e.target.value))} />
                <span className="input-group-text">
                  Play&nbsp;<img src={hourglassImageSrc} height={15} width={15} alt="" />
                </span>
                <input type="number" className="form-control" aria-label="Play"
                  value={rss.rssPlayMins} onChange={e => vm.rss.rssPlayMins(Number(e.target.value))} />
              </div>
            </div>
            <div className="col-auto">
              <div className="btn-toolbar" role="toolbar">
                <button type="button" className="btn btn-success" onClick={() => vm.rss.doRSS()}>
                  {rss.pollRssButtonText}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => vm.rss.doRssPlay()}>
                  {rss.playRssButtonText}
                </button>
                <button type="button" className="btn btn-danger" onClick={() => vm.rss.doRSSReset()}>
                  Mark All Read
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
