import { useRef } from 'react'
import { useMorse } from '../../context/MorseContext'

export function WorkingText() {
  const { vm, showRaw, playingTime, charsPlayed, rawTextCharCount, showingText, morseLoadImages } = useMorse()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const eyeSrc = morseLoadImages?.getSrc('eyeImage')
  const eyeslashSrc = morseLoadImages?.getSrc('eyeslashImage')
  const stopwatchSrc = morseLoadImages?.getSrc('stopwatchImage')
  const trashSrc = morseLoadImages?.getSrc('trashImage')
  const arrowleftSrc = morseLoadImages?.getSrc('arrowleftImage')

  return (
    <section className="col" title="Working text" aria-label="Working text">
      {/* Toolbar row */}
      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => vm.showRaw(!showRaw)}
        >
          <img height={14} width={14} src={showRaw ? eyeSrc : eyeslashSrc} alt="" />
          &nbsp;{showRaw ? 'Editing' : 'Preview'}
        </button>
        <small className="text-secondary">
          <span id="play-time-label" className="sr-only">Play time</span>
          <img alt="" height={13} width={13} src={stopwatchSrc} />
          <span aria-describedby="play-time-label" className="sr-only">
            {playingTime.minutes}:{playingTime.normedSeconds}
          </span>
          <span aria-hidden="true">
            <span>{playingTime.minutes}</span>:<span>{playingTime.normedSeconds}</span>
          </span>
          &nbsp;&middot;&nbsp;
          <span id="characters-played-label" className="sr-only">Characters played</span>
          <span aria-describedby="characters-played-label" className="sr-only">
            {charsPlayed} of {rawTextCharCount}
          </span>
          <span aria-hidden="true">
            Chars <span>{charsPlayed}</span>/<span>{rawTextCharCount}</span>
          </span>
        </small>
        <div className="ms-auto d-flex gap-1">
          <button
            id="btnClearText"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => vm.doClear()}
          >
            <img src={trashSrc} height={14} width={14} />&nbsp;Clear
          </button>
          <button
            id="btnLoadTextFile"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={arrowleftSrc} height={14} width={14} />&nbsp;Insert File
          </button>
          <input
            type="file"
            accept=".txt"
            id="txtfiletoread"
            className="form-control"
            ref={fileInputRef}
            onChange={e => vm.inputFileChange(e.target)}
            hidden
          />
        </div>
      </div>

      {/* Textarea */}
      <p role="note" className="sr-only">
        The following textarea contains the text that will be used for practice.
        This can be set manually or selected using the options found in the LICW Lessons section.
      </p>
      <textarea
        className="form-control"
        aria-label="Text"
        disabled={!showRaw}
        value={showingText}
        onChange={e => vm.showingText(e.target.value)}
      />
    </section>
  )
}
