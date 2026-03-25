import { observable, Observable, computed } from '../utils/observable'
import MorseStringUtils from '../utils/morseStringUtils'
import WordInfo from '../utils/wordInfo'
export class FlaggedWords {
  flaggedWords:Observable<string>
  flaggedWordsCount:Observable<number>
  lastFlaggedWordMs:number
  constructor () {
    this.lastFlaggedWordMs = Date.now()
    this.flaggedWords = observable('')

    this.flaggedWordsCount = computed(() => {
      if (!this.flaggedWords().trim()) {
        return 0
      }
      return MorseStringUtils.getWords(this.flaggedWords(), false).length
    }, [this.flaggedWords])
  }

  clear = () => {
    this.flaggedWords('')
  }

  addFlaggedWord = (word:WordInfo) => {
    if (!this.flaggedWords().trim()) {
      this.flaggedWords(this.flaggedWords().trim() + word.rawWord)
    } else {
      // deal with double click which is also used to pick a word
      const msNow = Date.now()
      const msPassedSince = msNow - this.lastFlaggedWordMs
      this.lastFlaggedWordMs = msNow
      const threshold = 500

      const words:WordInfo[] = this.flaggedWords() ? MorseStringUtils.getWords(this.flaggedWords(), false) : []

      const lastWord = words[words.length - 1]
      if (lastWord.rawWord === word.rawWord && (msPassedSince < threshold)) {
        // we have a double click scenario so remove it
        words.pop()
      } else {
        words.push(word)
      }
      if (words.length === 0) {
        this.flaggedWords('')
      } else {
        this.flaggedWords(words.map(w => w.rawWord).join(' '))
      }
    }
  }
}
