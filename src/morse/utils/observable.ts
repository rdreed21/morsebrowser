/**
 * Lightweight observable utility — drop-in replacement for the Knockout
 * observable API surface used by the app:  obs(), obs(value),
 * obs.subscribe(cb) → { dispose() }.
 *
 * Computed observables receive an explicit deps array instead of KO's
 * automatic dependency tracking.
 */

export type Subscription = { dispose(): void }

export interface Observable<T> {
  (): T
  (value: T): void
  subscribe(callback: (value: T) => void): Subscription
}

export interface ObservableArray<T> extends Observable<T[]> {
  push(...items: T[]): void
  remove(itemOrPredicate: T | ((item: T) => boolean)): void
  replace(item: T, replacement: T): void
}

// ── observable ────────────────────────────────────────────────────────────────

export function observable<T>(initial: T): Observable<T> {
  let value = initial
  const subscribers: Array<(v: T) => void> = []

  const obs = function (newValue?: T): T | void {
    if (arguments.length === 0) return value
    value = newValue!
    const snap = [...subscribers]
    snap.forEach(fn => fn(value))
  } as unknown as Observable<T>

  obs.subscribe = (callback: (v: T) => void): Subscription => {
    subscribers.push(callback)
    return {
      dispose: () => {
        const i = subscribers.indexOf(callback)
        if (i >= 0) subscribers.splice(i, 1)
      },
    }
  }

  return obs
}

// ── computed ──────────────────────────────────────────────────────────────────

/** Read-only derived value that re-evaluates whenever any dep changes. */
export function computed<T>(fn: () => T, deps: Observable<any>[]): Observable<T> {
  let evaluating = false
  const obs = observable(fn())
  deps.forEach(dep =>
    dep.subscribe(() => {
      if (evaluating) return
      evaluating = true
      try { obs(fn()) } finally { evaluating = false }
    })
  )
  return obs
}

/**
 * Read/write derived value.  The read function is re-run whenever a dep
 * changes; the write function contains the mutation logic.
 */
export function writableComputed<T>(
  options: { read: () => T; write: (value: T) => void },
  deps: Observable<any>[],
): Observable<T> {
  let evaluating = false
  const reread = () => {
    if (evaluating) return
    evaluating = true
    try { backing(options.read()) } finally { evaluating = false }
  }
  const backing = observable(options.read())
  deps.forEach(dep => dep.subscribe(reread))

  const obs = function (newValue?: T): T | void {
    if (arguments.length === 0) return backing()
    options.write(newValue!)
    backing(options.read())
  } as unknown as Observable<T>

  obs.subscribe = backing.subscribe.bind(backing) as typeof backing.subscribe
  return obs
}

// ── observableArray ───────────────────────────────────────────────────────────

export function observableArray<T>(initial: T[] = []): ObservableArray<T> {
  const obs = observable<T[]>([...initial]) as ObservableArray<T>

  obs.push = (...items: T[]) => {
    obs([...obs(), ...items])
  }

  obs.remove = (itemOrPredicate: T | ((item: T) => boolean)) => {
    const pred =
      typeof itemOrPredicate === 'function'
        ? (itemOrPredicate as (item: T) => boolean)
        : (item: T) => item === itemOrPredicate
    obs(obs().filter(item => !pred(item)))
  }

  obs.replace = (item: T, replacement: T) => {
    obs(obs().map(x => (x === item ? replacement : x)))
  }

  return obs
}
