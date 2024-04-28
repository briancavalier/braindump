// eslint-disable-next-line import/no-cycle
import { Fork } from '../effects/fork/fork'
import { EffectType, Fx, FxIterable, is } from '../fx'
import { pipe } from '../pipe'

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

export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
    finally: (s: S) => FxIterable<FE, void>
  }): FxIterable<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const SE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const E extends Effects, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const SE, const E extends Effects, const S, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially?: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return?: (r: R1 | R2, s: S) => R
    finally?: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2 | R> {
    return new Handler(f, handler, true)
  }

export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return: (r: R1, s: S) => R
    finally: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    return: (r: R1) => R
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    finally: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return: (r: R1, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const E extends Effects, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    return: (r: R1) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const SE, const E extends Effects, const S, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1>
export function handle<const E1, const R1, const E extends Effects, const FE, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially?: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return?: (r: R1, s: S) => R
    finally?: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R> {
    return new Handler(f, handler, true)
  }

const matches = <const E extends Effects, const T>(e: E, t: T): t is Instance<E> =>
  e.some(effectType => (t as any).id === effectType.id)

class Handler implements Fx<unknown, unknown> {
  effects: readonly EffectType[]
  initially: undefined | FxIterable<unknown, unknown> | undefined
  handle: (e: any, s: any) => FxIterable<unknown, unknown>
  return: undefined | ((r: any, s: any) => unknown)
  finally: undefined | ((s: any) => FxIterable<unknown, unknown>)

  constructor(
    public readonly fx: FxIterable<unknown, unknown>,
    handler: AnyHandler,
    public readonly forkable: boolean,
  ) {
    this.effects = handler.effects
    this.initially = handler.initially
    this.handle = handler.handle
    this.return = handler.return
    this.finally = handler.finally
  }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }

  *[Symbol.iterator]() {
    const i = this.fx[Symbol.iterator]()
    let state

    try {
      state = this.initially ? (yield* this.initially) : undefined
      let ir = i.next()

      while (!ir.done) {
        if (matches(this.effects, ir.value)) {
          const hr: Step<any, any, any> = yield* this.handle((ir.value), state as never) as any
          switch (hr.tag) {
            case 'return':
              return this.return ? this.return(hr.value, state as never) : hr.value
            case 'resume':
              state = hr.state
              ir = i.next(hr.value)
              break
          }
        }
        else if (is(Fork, ir.value))
          ir = i.next(yield new Fork(ir.value.arg, [...ir.value.context, { handler: this, state }]))
        else
          ir = i.next(yield ir.value as any)
      }

      return this.return ? this.return(ir.value, state as never) : ir.value
    } finally {
      if (i.return) i.return()
      if (this.finally) yield* this.finally(state as never)
    }
  }
}

export type HandlerContext = {
  handler: Handler
  state: unknown
}

export type AnyHandler = {
  effects: readonly EffectType[]
  initially?: undefined | FxIterable<unknown, unknown>
  handle: (e: any, s: any) => FxIterable<unknown, unknown>
  return?: undefined | ((r: any, s: any) => unknown)
  finally?: undefined | ((s: any) => FxIterable<unknown, unknown>)
}
