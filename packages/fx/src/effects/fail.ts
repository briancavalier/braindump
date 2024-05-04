import { Effect, Fx, fx, ok } from '../fx'
import { Control } from '../handler'

export class Fail<const E> extends Effect('fx/Fail/Fail')<E, never> { }

export type Failures<E> = E extends Fail<infer A> ? A : never

export const fail = <const E>(e: E) => new Fail(e).send()

export const catchIf = <const F>(match: (x: unknown) => x is F) =>
  <const E, const A>(f: Fx<E, A>) =>
    Control
      .on(Fail, (e) => fx(function* () {
        return match(e) ? Control.done(e) : Control.resume(yield* fail(e))
      }))
      .handle(f) as Fx<Exclude<E, Fail<F>>, A | Failures<E>>

export const catchAll = <const E, const A>(f: Fx<E, A>) =>
  Control
    .on(Fail, (e) => ok(Control.done(e)))
    .handle(f) as Fx<Exclude<E, Fail<any>>, A | Failures<E>>

export const catchFail = <const E, const A>(f: Fx<E, A>) =>
  Control
    .on(Fail, (e) => ok(Control.done(new Fail(e))))
    .handle(f) as Fx<Exclude<E, Fail<any>>, A | Extract<E, Fail<any>>>
