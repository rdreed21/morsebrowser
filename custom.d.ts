// experimented with this but just leaving js
declare module '*.svg' {
    const content: string
    export default content
  }
  declare module '*.png' {
    const content: string
    export default content
  }
  declare module '*.html' {
    const content: string
    export default content
  }

  // npm noise packages and wav converter have no @types — declare them as any
  declare module 'white-noise-node' {
    const content: any
    export default content
  }
  declare module 'pink-noise-node' {
    const content: any
    export default content
  }
  declare module 'brown-noise-node' {
    const content: any
    export default content
  }
  declare module 'audiobuffer-to-wav' {
    const toWav: (buffer: AudioBuffer) => ArrayBuffer
    export = toWav
  }
