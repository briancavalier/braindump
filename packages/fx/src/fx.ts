import { Pipeable, pipe } from './pipe'

export interface EffectType {
  new (...args: readonly any[]): any
}

export const EffectId = Symbol()

export class Effect <T, A, R = unknown> {
  public readonly [EffectId]!: T
  public readonly R!: R

  returning<RR extends R = R>() { return this as Fx<this, RR> }
  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }

  constructor(public readonly arg: A) { }

  *[Symbol.iterator](): Iterator<this, R, any> {
    return yield this
  }
}

export interface FxIterable<E, A> {
  [Symbol.iterator](): Iterator<E, A, unknown>
}

export interface Fx<E, A> extends FxIterable<E, A>, Pipeable {}

export const is = <const E extends EffectType>(e: E, x: unknown): x is InstanceType<E> =>
  !!x && (x as any).constructor === e

export const fx = <const E, const A>(f: () => Generator<E, A>): Fx<E, A> => new GenFx(f)

class GenFx<E, A> {
  constructor(public readonly f: () => Generator<E, A>) { }
  [Symbol.iterator]() { return this.f() }
  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }
}

// eslint-disable-next-line require-yield
export const ok = <const A>(a: A) => fx(function* () { return a })

// eslint-disable-next-line require-yield
export const sync = <const A>(f: () => A) => fx(function* () { return f() })
