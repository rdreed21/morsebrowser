import { useMorse } from '../../context/MorseContext'

export function WordList () {
  const { vm, cardsVisible, words, currentIndex, hideList, trailReveal, maxRevealedTrail, cardFontPx } = useMorse()

  if (!cardsVisible) return null

  return (
    <section aria-label="Cards" className="col">
      <div className="row gx-2 gy-2">
        {words.map((word, i) => {
          const isCurrentIndex = i === currentIndex
          const isLastWord = i === words.length - 1
          const btnClass = isCurrentIndex
            ? (isLastWord ? 'btn-danger' : 'btn-primary')
            : (isLastWord ? 'btn-outline-danger' : 'btn-outline-primary')
          const isRevealed = !hideList || (trailReveal && i <= maxRevealedTrail)
          const cleanWord = word.displayWord.replace('\r', '').replace('\n', '').trim()
          const displayText = isRevealed ? word.displayWord : 'X'.repeat(cleanWord.length)

          return (
            <div key={i} className="col-auto">
              <button
                className={`btn ${btnClass}`}
                title="Adds this text to the Flagged Cards text area"
                aria-selected={isCurrentIndex ? 'true' : 'false'}
                onClick={() => vm.flaggedWords.addFlaggedWord(word)}
                onDoubleClick={() => vm.setWordIndex(i)}
              >
                <span style={{ fontSize: cardFontPx }}>{displayText}</span>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
