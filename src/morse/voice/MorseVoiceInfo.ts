export class MorseVoiceInfo {
  textToSpeak: string
  voice: any
  volume: number
  rate: number
  pitch: number
  onEnd: () => void
}
