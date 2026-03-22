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

// TypeScript 5.x requires an explicit namespace for ko.Observable<T> etc.
// @types/knockout uses KnockoutObservable<T> global interfaces without a namespace,
// so we bridge the gap here.
declare namespace ko {
  type Observable<T> = KnockoutObservable<T>
  type Computed<T> = KnockoutComputed<T>
  type PureComputed<T> = KnockoutComputed<T>
  type ObservableArray<T> = KnockoutObservableArray<T>
  // Used as a cast target for .extend() calls with custom extender keys
  type ObservableExtenderOptions<T> = { [key: string]: any }
}

// Allow assigning custom extenders to ko.extenders (saveCookie, showingChange, etc.)
interface KnockoutExtenders {
  [key: string]: (target: any, option: any) => any
}
