import { useMorse } from '../../context/MorseContext'

export function Controls() {
  const { vm, playerPlaying, isPaused, playingTime, isShuffled, loop, loopnoshuffle,
    hideList, voice, morseLoadImages } = useMorse()

  const img = (key: string) => morseLoadImages?.getSrc(key)

  const loopText = !loop ? 'Loop Off' : !loopnoshuffle ? 'Loop Shuffle' : 'Loop On'

  return (
    <section className="col" aria-label="Playback controls">
      <div className="d-flex flex-wrap gap-2 align-items-center py-1">

        {/* Transport: play / pause / stop */}
        <div className="btn-group" role="group" aria-label="Transport controls">
          <button id="btnPlayButton" type="button" className="btn btn-success" aria-label="Play"
            onClick={() => vm.doPlay(false, true)}>
            {!playerPlaying && (
              <>
                <img src={img('playImage')} alt="" height={16} width={16} />
                <span>&nbsp;Play</span>
              </>
            )}
            {playerPlaying && (
              <span>
                <span>{playingTime.minutes}</span>:<span>{playingTime.normedSeconds}</span>
              </span>
            )}
            &nbsp;<span className="spinner-border spinner-border-sm" role="status" aria-label="Playing"
              style={{ display: playerPlaying ? '' : 'none' }}></span>
          </button>
          <button id="btnPause" type="button" className="btn btn-warning"
            onClick={() => isPaused ? vm.doPlay(true, false) : vm.doPause(false, true, false)}>
            {!isPaused && <img src={img('pauseImage')} height={16} width={16} alt="" />}
            &nbsp;Pause&nbsp;
            <span className="spinner-grow spinner-grow-sm text-dark" role="status" aria-hidden="true"
              style={{ display: isPaused ? '' : 'none' }}></span>
          </button>
          <button id="btnStop" type="button" className="btn btn-danger"
            onClick={() => vm.doPause(true, false, true)}>
            <img src={img('stopImage')} height={16} width={16} alt="" />&nbsp;Stop
          </button>
        </div>

        {/* Navigation: rewind / back / forward */}
        <div className="btn-group" role="group" aria-label="Navigation controls">
          <button id="btnFullRewind" type="button" className="btn btn-outline-secondary"
            aria-label="Full rewind" onClick={() => vm.fullRewind()}>
            <img src={img('skipstartImage')} height={16} width={16} alt="" />&nbsp;Full RW
          </button>
          <button id="btnBackButton" type="button" className="btn btn-outline-secondary"
            onClick={() => vm.decrementIndex()}>
            <img src={img('skipbackImage')} height={16} width={16} alt="" />&nbsp;Back 1
          </button>
          <button id="btnFwd1" type="button" className="btn btn-outline-secondary"
            onClick={() => vm.incrementIndex()}>
            Fwd 1&nbsp;<img src={img('skipforwardImage')} height={16} width={16} alt="" />
          </button>
        </div>

        {/* View: reveal / shuffle / loop */}
        <div className="btn-group" role="group" aria-label="View options">
          <input aria-label="Hide cards" type="checkbox"
            className="btn-check" id="btnHideList" autoComplete="off"
            checked={hideList}
            onChange={e => vm.hideList(e.target.checked)} />
          <label aria-hidden="true" className="btn btn-outline-primary" htmlFor="btnHideList">
            <img height={16} width={16}
              src={!hideList ? img('eyeImage') : img('eyeslashImage')} />&nbsp;Reveal
          </label>
          <button id="btnShuffle" type="button" className="btn btn-outline-primary"
            onClick={() => vm.shuffleWords(false)}>
            <img src={img('shuffleImage')} alt="" height={16} width={16} />&nbsp;
            {isShuffled ? 'UnShuffle' : 'Shuffle'}
          </button>
          <button id="btnLoop" type="button" className="btn btn-outline-primary"
            onClick={() => vm.toggleLoop()}>
            <img src={img('arrowrepeatImage')} alt="" height={16} width={16} />&nbsp;{loopText}
          </button>
        </div>

        {/* Manual voice (conditional) */}
        {voice.manualVoice && voice.voiceEnabled && (
          <button id="btnmanualvoice" type="button" className="btn btn-outline-info"
            onClick={() => vm.speakVoiceBuffer()}>
            <img src={img('bootstrapRebootImage')} alt="" height={16} width={16} />&nbsp;Voice Recap
          </button>
        )}

        {/* Download audio */}
        <button type="button" className="btn btn-outline-secondary"
          title="Downloads an audio file using the current settings"
          onClick={() => vm.doDownload()}>
          <img src={img('downloadImage')} alt="" height={16} width={16} />&nbsp;Download Audio
        </button>
        <a id="downloadLink"></a>

      </div>
    </section>
  )
}
