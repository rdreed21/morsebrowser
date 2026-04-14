import { useState } from 'react'
import { useMorse } from '../../context/MorseContext'

export function NoiseAccordion () {
  const [isOpen, setIsOpen] = useState(false)
  const { vm, noiseType, noiseVolume, morseLoadImages } = useMorse()
  const soundwaveImageSrc = morseLoadImages?.getSrc('soundwaveImage') ?? ''
  const volumeImageSrc = morseLoadImages?.getSrc('volumeImage') ?? ''

  return (
    <>
      <h2 className="accordion-header" id="headingNoiseExperimental">
        <button
          className={`accordion-button${isOpen ? '' : ' collapsed'}`}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="collapseNoiseExperimental"
          onClick={() => setIsOpen(o => !o)}
        >
          <img src={soundwaveImageSrc} height={20} width={20} alt="" />&nbsp;Noise (Experimental)
        </button>
      </h2>
      <div id="collapseNoiseExperimental" className={`accordion-collapse${isOpen ? ' show' : ' collapse'}`} aria-labelledby="headingNoiseExperimental">
        <div className="accordion-body">
          <div className="row row-cols-1 row-cols-sm-2 gy-2 gx-2">
            <div className="col-auto">
              <fieldset className="btn-group" aria-label="Noise Type">
                <input type="radio" className="btn-check" value="off" name="noiseTypeRadio" id="noiseBtnRadioOff"
                  autoComplete="off" checked={noiseType === 'off'} onChange={() => vm.noiseType('off')} aria-label="Off" />
                <label className="btn btn-outline-primary" htmlFor="noiseBtnRadioOff" aria-hidden="true">Off</label>

                <input type="radio" className="btn-check" value="white" name="noiseTypeRadio" id="noiseBtnRadioWhite"
                  autoComplete="off" checked={noiseType === 'white'} onChange={() => vm.noiseType('white')} aria-label="White" />
                <label className="btn btn-outline-info" htmlFor="noiseBtnRadioWhite" aria-hidden="true">White</label>

                <input type="radio" className="btn-check" value="brown" name="noiseTypeRadio" id="noiseBtnRadioBrown"
                  autoComplete="off" checked={noiseType === 'brown'} onChange={() => vm.noiseType('brown')} aria-label="Brown" />
                <label className="btn btn-outline-secondary" htmlFor="noiseBtnRadioBrown" aria-hidden="true">Brown</label>

                <input type="radio" className="btn-check" value="pink" name="noiseTypeRadio" id="noiseBtnRadioPink"
                  autoComplete="off" checked={noiseType === 'pink'} onChange={() => vm.noiseType('pink')} aria-label="Pink" />
                <label className="btn btn-outline-danger" htmlFor="noiseBtnRadioPink" aria-hidden="true">Pink</label>
              </fieldset>
            </div>
            <div className="col-auto">
              <div className="input-group">
                <label htmlFor="noiseVolume" className="input-group-text">
                  <img role="img" height={20} width={20} src={volumeImageSrc} alt="Noise Volume" />
                </label>
                <input
                  id="noiseVolume"
                  name="noiseVolume"
                  type="number"
                  className="form-control"
                  min={1}
                  max={10}
                  step={1}
                  value={noiseVolume}
                  onChange={e => vm.noiseVolume(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
