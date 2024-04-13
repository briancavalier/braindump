import { popContext, pushContext } from './context'
import { EffectType, Fx } from './fx'

export type Step<A, R, S> = Resume<A, S> | Return<R>
export type Resume<A, S> = { tag: 'resume', value: A, state: S }
export type Return<A> = { tag: 'return', value: A }

export const resume = <const A>(a: A): Step<A, never, void> => ({ tag: 'resume', value: a, state: undefined })
export const resumeWith = <const A, const S>(a: A, s: S): Step<A, never, S> => ({ tag: 'resume', value: a, state: s })
export const done = <const A>(a: A): Step<never, A, never> => ({ tag: 'return', value: a })

export function control<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const FE, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, Step<A, R2, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const SE, const S, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2, R>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2, R>
export function control<const E1, const R1, const SE, const E extends Record<string, EffectType>, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, Step<A, R2, S>>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const FE, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, Step<A, R2, void>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Record<string, EffectType>, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, Step<A, R2, void>>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2, R1 | R2>
export function* control<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially?: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, Step<A, R2, S>>
    return?: (r: R1 | R2, s: S) => R
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1 | R2 | R> {
    const i = f[Symbol.iterator]()
    let s
    try {
      s = h.initially ? (yield* h.initially) : undefined
      let ir = i.next()

      while (!ir.done) {
        if (matches2(match, ir.value)) {
          const hr: Step<A, R1 | R2, S> = yield* h.handle((ir.value), s as never)
          switch (hr.tag) {
            case 'return':
              return h.return ? h.return(hr.value, s as never) : hr.value
            case 'resume':
              s = hr.state
              ir = i.next(hr.value)
              break
          }
        }
        else ir = i.next(yield ir.value as any)
      }

      return h.return ? h.return(ir.value, s as never) : ir.value
    } finally {
      if (i.return) i.return()
      if(h.finally) yield* h.finally(s as never)
    }
  }

export function handle<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, readonly [A, S]>
    return: (r: R1, s: S) => R
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const FE, const A, const E2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, A>
    return: (r: R1) => R
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, readonly [A, S]>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const SE, const S, const A, const E2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, readonly [A, S]>
    return: (r: R1, s: S) => R
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2, R>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const A, const E2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, A>
    return: (r: R1) => R
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2, R>
export function handle<const E1, const R1, const SE, const E extends Record<string, EffectType>, const S, const A, const E2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, readonly [A, S]>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2, R1>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const FE, const A, const E2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, A>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Record<string, EffectType>, const A, const E2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E[keyof E]>) => Fx<E2, A>
  }): Fx<Exclude<E1, InstanceType<E[keyof E]>> | E2, R1>
export function* handle<const E1, const R1, const E extends Record<string, EffectType>, const SE, const FE, const S, const A, const E2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially?: Fx<SE, S>,
    handle: (e: InstanceType<E[keyof E]>, s: S) => Fx<E2, readonly [A, S]>
    return?: (r: R1, s: S) => R
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, InstanceType<E[keyof E]>> | E2 | FE, R1 | R> {
  const i = f[Symbol.iterator]()
  pushContext({ effects: match, handler: h })
  let s

  try {
    s = h.initially ? (yield* h.initially) : undefined
    let ir = i.next()

    while (!ir.done) {
      if (matches2(match, ir.value)) {
        const hr: A | readonly [A, S] = yield* h.handle((ir.value), s as never)
        if(Array.isArray(hr)) {
          s = hr[1]
          ir = i.next(hr[0])
        } else {
          ir = i.next(hr)
        }
      }
      else ir = i.next(yield ir.value as any)
    }

    return h.return ? h.return(ir.value, s as never) : ir.value
  } finally {
    if (i.return) i.return()
    if (h.finally) yield* h.finally(s as never)
    popContext()
  }
}

const matches2 = <const T extends Record<string, EffectType>, const E>(t: T, e: E): e is Extract<InstanceType<T[keyof T]> , E>=>
  (e as any).type as PropertyKey in t
