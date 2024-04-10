import { EffectType, Fx, isEffect } from './fx'

export type Step<A, R, S> = Resume<A, S> | Return<R>
export type Resume<A, S> = { done: false, value: A, state: S }
export type Return<A> = { done: true, value: A }

export const resume = <const A>(a: A): Step<A, never, void> => ({ done: false, value: a, state: undefined })
export const resumeWith = <const A, const S>(a: A, s: S): Step<A, never, S> => ({ done: false, value: a, state: s })
export const done = <const A>(a: A): Step<never, A, never> => ({ done: true, value: a })

export function handle3<const E1, const R1, const E extends EffectType, const S, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: () => S,
    handle: (e: InstanceType<E>, s: S) => Fx<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
  }): Fx<Exclude<E1, InstanceType<E>> | E2, R>
export function handle3<const E1, const R1, const E extends EffectType, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially: () => S,
    handle: (e: InstanceType<E>, s: S) => Fx<E2, Step<A, R2, S>>
  }): Fx<Exclude<E1, InstanceType<E>> | E2, R1 | R2>
export function handle3<const E1, const R1, const E extends EffectType, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E>) => Fx<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
  }): Fx<Exclude<E1, InstanceType<E>> | E2, R>
export function handle3<const E1, const R1, const E extends EffectType, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    handle: (e: InstanceType<E>) => Fx<E2, Step<A, R2, void>>
  }): Fx<Exclude<E1, InstanceType<E>> | E2, R1 | R2>
export function* handle3<const E1, const R1, const E extends EffectType, const S, const A, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  match: E,
  h: {
    initially?: () => S,
    handle: (e: InstanceType<E>, s: S) => Fx<E2, Step<A, R2, S>>
    return?: (r: R1 | R2, s: S) => R
  }): Fx<Exclude<E1, InstanceType<E>> | E2, R1 | R2 | R> {
    const i = f[Symbol.iterator]()
    try {
      let s = h.initially ? h.initially() : undefined
      let ir = i.next()

      while (!ir.done) {
        if (isEffect(match, ir.value)) {
          const hr = yield* h.handle(ir.value, s as never)
          if (hr.done) return h.return ? h.return(hr.value, s as never) : hr.value
          else {
            s = hr.state
            ir = i.next(hr.value)
          }
        }
        else ir = i.next(yield ir.value as any)
      }

      return h.return ? h.return(ir.value, s as never) : ir.value
    } finally {
      if (i.return) i.return()
    }
  }
