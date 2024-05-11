import { Map, Ok, Sync } from './internal/generator'
import { Pipeable, pipe } from './internal/pipe'

export interface Fx<E, A> extends Pipeable {
  [Symbol.iterator](): Iterator<E, A, unknown>
}

export const fx = <const E, const A>(f: () => Generator<E, A>): Fx<E, A> => new GenFx(f)

export const ok = <const A>(a: A): Fx<never, A> => new Ok(a)

export const sync = <const A>(f: () => A): Fx<never, A> => new Sync(f)

export const unit = ok(undefined)

export const map = <const A, const B>(f: (a: A) => B) =>
  <const E>(x: Fx<E, A>): Fx<E, B> => new Map<E, A, B>(f, x as any) as Fx<E, B>

class GenFx<E, A> implements Fx<E, A> {
  constructor(public readonly f: () => Generator<E, A>) { }

  [Symbol.iterator](): Iterator<E, A> { return this.f() }

  pipe() { return pipe(this, arguments) }
}
