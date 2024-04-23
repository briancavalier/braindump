import { Fork } from './concurrent/fork'
import { EffectType, Fx, is } from './fx'

export type Step<A, R, S> = Resume<A, S> | Return<R>
export type Resume<A, S = void> = { tag: 'resume', value: A, state: S }
export type Return<A> = { tag: 'return', value: A }

export function resume<const A>(a: A): Resume<A>
export function resume<const A, const S>(a: A, s: S): Resume<A, S>
export function resume<const A, const S>(a: A, s?: S): Resume<A, void | S> {
  return ({ tag: 'resume', value: a, state: s }) as const
}

export const done = <const A>(a: A): Step<never, A, never> => ({ tag: 'return', value: a })

export type Effects = readonly EffectType[]
export type Instance<E extends Effects> = InstanceType<E[number]>

export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Step<EE['R'], R2, S>>
    return: (r: R1 | R2, s: S) => R
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const FE, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Step<EE['R'], R2, void>>
    return: (r: R1 | R2) => R
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Step<EE['R'], R2, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const SE, const S, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Step<EE['R'], R2, S>>
    return: (r: R1 | R2, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const E extends Effects, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Step<EE['R'], R2, void>>
    return: (r: R1 | R2) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const SE, const E extends Effects, const S, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Step<EE['R'], R2, S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const FE, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Step<EE['R'], R2, void>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Step<EE['R'], R2, void>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1 | R2>
export function* control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2, const R2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially?: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Step<EE['R'], R2, S>>
    return?: (r: R1 | R2, s: S) => R
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2 | R> {
    const i = f[Symbol.iterator]()
    let s
    try {
      s = handler.initially ? (yield* handler.initially) : undefined
      let ir = i.next()

      while (!ir.done) {
        if (matches(effects, ir.value)) {
          const hr: Step<unknown, R1 | R2, S> = yield* handler.handle((ir.value), s as never)
          switch (hr.tag) {
            case 'return':
              return handler.return ? handler.return(hr.value, s as never) : hr.value
            case 'resume':
              s = hr.state
              ir = i.next(hr.value)
              break
          }
        }
        else
          ir = i.next(yield ir.value as any)
      }

      return handler.return ? handler.return(ir.value, s as never) : ir.value
    } finally {
      if (i.return) i.return()
      if(handler.finally) yield* handler.finally(s as never)
    }
  }

export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Resume<EE['R'], S>>
    return: (r: R1, s: S) => R
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const FE, const E2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Resume<EE['R']>>
    return: (r: R1) => R
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Resume<EE['R'], S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const S, const E2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Resume<EE['R'], S>>
    return: (r: R1, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const E extends Effects, const E2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Resume<EE['R']>>
    return: (r: R1) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const SE, const E extends Effects, const S, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Resume<EE['R'], S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1>
export function handle<const E1, const R1, const E extends Effects, const FE, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Resume<EE['R']>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: <EE extends Instance<E>>(e: EE) => Fx<E2, Resume<EE['R']>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1>
export function* handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const E2, const R>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially?: Fx<SE, S>,
    handle: <EE extends Instance<E>>(e: EE, s: S) => Fx<E2, Resume<EE['R'], S>>
    return?: (r: R1, s: S) => R
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R> {
  const i = f[Symbol.iterator]()
  let s

  try {
    s = handler.initially ? (yield* handler.initially) : undefined
    let ir = i.next()

    while (!ir.done) {
      if (matches(effects, ir.value)) {
        const hr: Resume<unknown, S> = yield* handler.handle((ir.value), s as never)
        s = hr.state
        ir = i.next(hr.value)
      }
      else if (is(Fork, ir.value))
        ir = i.next(yield new Fork(ir.value.arg, [...ir.value.context, { effects, handler, state: s }]) as any)
      else
        ir = i.next(yield ir.value as any)
    }

    return handler.return ? handler.return(ir.value, s as never) : ir.value
  } finally {
    if (i.return) i.return()
    if (handler.finally) yield* handler.finally(s as never)
  }
}

const matches = <const E extends Effects, const T>(e: E, t: T): t is Instance<E> =>
  e.some(effectType => (t as any).tag === effectType.tag)
