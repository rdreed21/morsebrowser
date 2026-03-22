export class RssConfig {
  setText:(s: string) => void
  fullRewind:() => void
  doPlay:(playJustEnded:boolean, fromPlayButton:boolean) => void
  lastFullPlayTime:() => number
  playerPlaying:() => boolean
  constructor (setText:(s: string) => void,
    fullRewind:() => void,
    doPlay:(playJustEnded:boolean, fromPlayButton:boolean) => void,
    lastFullPlayTime:() => number,
    playerPlaying:() => boolean) {
    this.setText = setText
    this.fullRewind = fullRewind
    this.doPlay = doPlay
    this.lastFullPlayTime = lastFullPlayTime
    this.playerPlaying = playerPlaying
  }
}
