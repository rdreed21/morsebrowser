import { computed, observable, observableArray, writableComputed } from './observable'

describe('observable', () => {
  it('reads initial value', () => {
    const o = observable(1)
    expect(o()).toBe(1)
  })

  it('writes and notifies subscribers', () => {
    const o = observable('a')
    const fn = vi.fn()
    o.subscribe(fn)
    o('b')
    expect(o()).toBe('b')
    expect(fn).toHaveBeenCalledWith('b')
  })

  it('dispose removes subscriber', () => {
    const o = observable(0)
    const fn = vi.fn()
    const sub = o.subscribe(fn)
    sub.dispose()
    o(1)
    expect(fn).not.toHaveBeenCalled()
  })

  it('notifies all subscribers for one write', () => {
    const o = observable(0)
    const a = vi.fn()
    const b = vi.fn()
    o.subscribe(a)
    o.subscribe(b)
    o(7)
    expect(a).toHaveBeenCalledWith(7)
    expect(b).toHaveBeenCalledWith(7)
  })
})

describe('computed', () => {
  it('re-evaluates when a dependency changes', () => {
    const a = observable(1)
    const b = observable(2)
    const sum = computed(() => a() + b(), [a, b])
    expect(sum()).toBe(3)
    a(10)
    expect(sum()).toBe(12)
  })
})

describe('writableComputed', () => {
  it('write runs user logic then syncs backing', () => {
    const base = observable(0)
    const wc = writableComputed({
      read: () => base() * 2,
      write: (v) => { base(v) },
    }, [base])
    expect(wc()).toBe(0)
    wc(5)
    expect(base()).toBe(5)
    expect(wc()).toBe(10)
  })
})

describe('observableArray', () => {
  it('push appends and notifies', () => {
    const a = observableArray<number>([1])
    const fn = vi.fn()
    a.subscribe(fn)
    a.push(2)
    expect(a()).toEqual([1, 2])
    expect(fn).toHaveBeenCalled()
  })

  it('remove by value', () => {
    const a = observableArray([1, 2, 3])
    a.remove(2)
    expect(a()).toEqual([1, 3])
  })

  it('remove by predicate', () => {
    const a = observableArray([1, 2, 3])
    a.remove((x) => x % 2 === 0)
    expect(a()).toEqual([1, 3])
  })

  it('replace swaps matching item', () => {
    const a = observableArray(['a', 'b', 'a'])
    a.replace('a', 'z')
    expect(a()).toEqual(['z', 'b', 'z'])
  })
})
