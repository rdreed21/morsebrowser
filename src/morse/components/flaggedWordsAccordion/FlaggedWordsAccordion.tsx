import { useState } from 'react'
import { useMorse } from '../../context/MorseContext'

export function FlaggedWordsAccordion () {
  const [isOpen, setIsOpen] = useState(false)
  const { vm, flaggedWords, morseLoadImages } = useMorse()
  const flagImageSrc = morseLoadImages?.getSrc('flagImage') ?? ''
  const uploadImageSrc = morseLoadImages?.getSrc('uploadImage') ?? ''
  const trashImageSrc = morseLoadImages?.getSrc('trashImage') ?? ''

  return (
    <>
      <h2 className="accordion-header" id="headingTwo">
        <button
          className={`accordion-button${isOpen ? '' : ' collapsed'}`}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="collapseTwo"
          id="btnFlaggedWordsAccordianButton"
          onClick={() => setIsOpen(o => !o)}
        >
          <img height={20} width={20} src={flagImageSrc} alt="" /><span>&nbsp;</span>
          Flagged cards (click cards you missed in the word list to toggle adding them here)
          <span>&nbsp;</span>
          <span className="badge bg-success">{flaggedWords.flaggedWordsCount}</span>
        </button>
      </h2>
      <div id="collapseTwo" className={`accordion-collapse${isOpen ? ' show' : ' collapse'}`} aria-labelledby="headingTwo">
        <div className="accordion-body">
          <div className="input-group">
            <span role="button" id="btnSetFlagged" className="input-group-text" onClick={() => vm.setFlagged()}>
              <img height={20} width={20} src={uploadImageSrc} alt="" />&nbsp;Load As Text
            </span>
            <span role="button" id="btnClearFlagged" className="input-group-text" onClick={() => vm.clearFlagged()}>
              <img height={20} width={20} src={trashImageSrc} alt="" />&nbsp;Clear
            </span>
            <textarea
              className="form-control"
              aria-label="Flagged Words"
              value={flaggedWords.flaggedWordsText}
              onChange={e => vm.flaggedWords.flaggedWords(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  )
}
