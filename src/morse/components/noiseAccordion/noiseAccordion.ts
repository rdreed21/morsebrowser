import { MorseViewModel } from '../../morse'
import imageTemplate from './noiseAccordion.html'
class NoiseAccordion {
  vm: MorseViewModel
  soundwaveImageSrc: string
  volumeImageSrc: string
  constructor (params: any) {
    this.vm = params.root
    this.soundwaveImageSrc = this.vm.morseLoadImages().getSrc('soundwaveImage')
    this.volumeImageSrc = this.vm.morseLoadImages().getSrc('volumeImage')
  }
}
// https://keepinguptodate.com/pages/2019/12/using-typescript-with-knockout/
export default { viewModel: NoiseAccordion, template: imageTemplate }
