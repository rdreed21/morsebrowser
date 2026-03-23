import { MorseViewModel } from '../../morse'
import imageTemplate from './flaggedWordsAccordion.html'
class FlaggedWordsAccordion {
  vm:MorseViewModel
  flagImageSrc: string
  uploadImageSrc: string
  trashImageSrc: string
  constructor (params: any) {
    this.vm = params.root
    this.flagImageSrc = this.vm.morseLoadImages().getSrc('flagImage')
    this.uploadImageSrc = this.vm.morseLoadImages().getSrc('uploadImage')
    this.trashImageSrc = this.vm.morseLoadImages().getSrc('trashImage')
  }
}
// https://keepinguptodate.com/pages/2019/12/using-typescript-with-knockout/
export default { viewModel: FlaggedWordsAccordion, template: imageTemplate }
