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
export type Type<E extends Effects> = InstanceType<E[number]>

export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Step<A, R2, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Type<E>> | E2 | FE, readonly [R1 | R2, S]>
export function control<const E1, const R1, const SE, const E extends Effects, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Step<A, R2, S>>
  }): Fx<SE | Exclude<E1, Type<E>> | E2, readonly [R1 | R2, S]>
export function control<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: (e: Type<E>) => Fx<E2, Step<A, R2, void>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Type<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: (e: Type<E>) => Fx<E2, Step<A, R2, void>>
  }): Fx<Exclude<E1, Type<E>> | E2, R1 | R2>
export function* control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially?: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Step<A, R2, S>>
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Type<E>> | E2 | FE, R1 | R2 | readonly [R1 | R2, S]> {
    const i = f[Symbol.iterator]()
    let s
    try {
      s = handler.initially ? (yield* handler.initially) : undefined
      let ir = i.next()

      while (!ir.done) {
        if (matches(effects, ir.value)) {
          const hr: Step<A, R1 | R2, S> = yield* handler.handle((ir.value), s as never)
          switch (hr.tag) {
            case 'return':
              return handler.initially ? [ir.value, s as S] : ir.value
            case 'resume':
              s = hr.state
              ir = i.next(hr.value)
              break
          }
        }
        else
          ir = i.next(yield ir.value as any)
      }

      return handler.initially ? [ir.value, s as S] : ir.value
    } finally {
      if (i.return) i.return()
      if(handler.finally) yield* handler.finally(s as never)
    }
  }

export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Resume<A, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Type<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const FE, const A, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: (e: Type<E>) => Fx<E2, Resume<A>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Type<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const S, const A, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Resume<A, S>>
  }): Fx<SE | Exclude<E1, Type<E>> | E2, readonly [R1, S]>
export function handle<const E1, const R1, const E extends Effects, const A, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    handle: (e: Type<E>) => Fx<E2, Resume<A>>
  }): Fx<Exclude<E1, Type<E>> | E2, R1>
export function* handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2>(
  f: Fx<E1, R1>,
  effects: E,
  handler: {
    initially?: Fx<SE, S>,
    handle: (e: Type<E>, s: S) => Fx<E2, Resume<A, S>>
    finally?: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Type<E>> | E2 | FE, R1 | readonly [R1, S]> {
  const i = f[Symbol.iterator]()
  let s

  try {
    s = handler.initially ? (yield* handler.initially) : undefined
    let ir = i.next()

    while (!ir.done) {
      if (matches(effects, ir.value)) {
        const hr: Resume<A, S> = yield* handler.handle((ir.value), s as never)
        s = hr.state
        ir = i.next(hr.value)
      }
      else if (is(Fork, ir.value))
        ir = i.next(yield new Fork(ir.value.arg, [...ir.value.context, { effects, handler, state: s }]) as any)
      else
        ir = i.next(yield ir.value as any)
    }

    return handler.initially ? [ir.value, s as S] : ir.value
  } finally {
    if (i.return) i.return()
    if (handler.finally) yield* handler.finally(s as never)
  }
}

const matches = <const E extends Effects, const T>(e: E, t: T): t is Type<E> =>
  e.some(effectType => (t as any).tag === effectType.tag)
