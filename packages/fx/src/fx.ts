import * as G from './internal/generator'
import { Pipeable, pipe } from './internal/pipe'

export interface EffectType {
  new (...args: readonly any[]): any
}

export const EffectTypeId = Symbol()

export class Effect <T, A, R = unknown> implements Pipeable {
  public readonly _fxTypeId = EffectTypeId
  public readonly _fxEffectId!: T
  public readonly R!: R

  returning<RR extends R>() { return this as Fx<this, RR> }

  pipe() { return pipe(this, arguments) }

  constructor(public readonly arg: A) { }

  [Symbol.iterator](): Iterator<this, R, any> {
    return new G.Once<this, R>(this)
  }
}

export const isEffect = <E>(e: E): e is E & Effect<unknown, unknown, unknown>  =>
  !!e && (e as any)._fxTypeId === EffectTypeId

export interface FxIterable<E, A> {
  [Symbol.iterator](): Iterator<E, A, unknown>
}

export interface Fx<E, A> extends FxIterable<E, A>, Pipeable {}

export const is = <const E extends EffectType>(e: E, x: unknown): x is InstanceType<E> =>
  !!x && (x as any).constructor === e

export const fx = <const E, const A>(f: () => Generator<E, A>): Fx<E, A> => new GenFx(f)

class GenFx<E, A> implements Fx<E, A> {
  constructor(public readonly f: () => Generator<E, A>) { }

  [Symbol.iterator](): Iterator<E, A> { return this.f() }

  pipe() { return pipe(this, arguments) }
}

export const ok = <const A>(a: A): Fx<never, A> => new G.Ok(a)

export const sync = <const A>(f: () => A) => new G.Sync(f)

export const unit = ok(undefined)

export const map = <const A, const B>(f: (a: A) => B) =>
  <const E>(x: Fx<E, A>) => new G.Map<E, A, B>(f, x as any) as Fx<E, B>
