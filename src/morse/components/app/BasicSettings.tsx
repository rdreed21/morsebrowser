import { useMorse } from '../../context/MorseContext'
import { SimpleImage } from '../morseImage/SimpleImage'

export function BasicSettings () {
  const { vm, speed, lessons, volume, morseLoadImages } = useMorse()
  const userPresetActive = !!lessons.selectedSettingsPreset?.isDummy
  const lockSrc = morseLoadImages?.getSrc('lockImage')
  const unlockSrc = morseLoadImages?.getSrc('unlockImage')
  const volumeSrc = morseLoadImages?.getSrc('volumeImage')

  return (
    <section className="col" title="Basic settings" aria-label="Basic settings">
      <div className="d-flex flex-wrap gap-3 align-items-end py-1">

        {/* Char speed (WPM) */}
        <div>
          <label htmlFor="wpm" className="form-label mb-1 small fw-semibold text-secondary">
            <SimpleImage icon="speedometerImage" height={14} width={14} aria-hidden="true" />&nbsp;Char Speed (WPM)
          </label>
          <input
            id="wpm"
            name="wpm"
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80, display: speed.variableSpeedDisplay ? 'none' : '' }}
            min={1}
            disabled={!userPresetActive}
            value={speed.wpm}
            onChange={e => vm.settings.speed.wpm(Number(e.target.value))}
          />
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80, display: speed.variableSpeedDisplay ? '' : 'none' }}
            aria-label="Variable character speed"
            value={speed.vWpm}
            disabled
            readOnly
          />
        </div>

        {/* Effective speed (FWPM) */}
        <div>
          <label
            htmlFor="trueWpm"
            className="form-label mb-1 small fw-semibold text-secondary"
            style={{ cursor: userPresetActive ? 'pointer' : 'default' }}
            onClick={() => userPresetActive && vm.settings.speed.syncWpm(!speed.syncWpm)}
          >
            Effective Speed (FWPM)&nbsp;
            <input
              type="image"
              role="checkbox"
              alt="Sync WPM speed"
              style={{ verticalAlign: 'middle' }}
              aria-checked={speed.syncWpm}
              src={speed.syncWpm ? lockSrc : unlockSrc}
            />
          </label>
          <input
            id="trueWpm"
            name="trueWpm"
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80, display: speed.variableSpeedDisplay ? 'none' : '' }}
            min={1}
            max={speed.trueWpm}
            disabled={speed.syncWpm || !userPresetActive}
            value={speed.fwpm}
            onChange={e => vm.settings.speed.fwpm(Number(e.target.value))}
          />
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80, display: speed.variableSpeedDisplay ? '' : 'none' }}
            aria-label="Variable effective speed"
            value={speed.vFwpm}
            disabled
            readOnly
          />
        </div>

        {/* Volume */}
        <div>
          <label htmlFor="txtVolume" className="form-label mb-1 small fw-semibold text-secondary">
            <img alt="Volume" src={volumeSrc} width={14} height={14} />&nbsp;Volume
          </label>
          <input
            id="txtVolume"
            name="txtVolume"
            type="number"
            className="form-control form-control-sm"
            style={{ width: 80 }}
            min={1}
            max={10}
            step={1}
            value={volume}
            onChange={e => vm.volume(Number(e.target.value))}
          />
        </div>

      </div>
    </section>
  )
}
