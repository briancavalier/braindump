import { Effect, Fx, fx, ok } from '../fx'
import { control, done, resume } from '../handler'

export class Fail<const E> extends Effect('fx/Fail.Fail')<E, never> { }

export type Failures<E> = E extends Fail<infer A> ? A : never

export const fail = <const E>(e: E) => new Fail(e).send()

export const catchIf = <const F>(match: (x: unknown) => x is F) =>
  <const E, const A>(f: Fx<E, A>) =>
    control(f)
      .on(Fail, (e) => fx(function* () {
        return match(e) ? done(e) : resume(yield* fail(e))
      }))
      .return() as Fx<Exclude<E, Fail<F>>, A | Failures<E>>

export const catchAll = <const E, const A>(f: Fx<E, A>) =>
  control(f)
    .on(Fail, (e) => ok(done(e)))
    .return() as Fx<Exclude<E, Fail<any>>, A | Failures<E>>

export const catchFail = <const E, const A>(f: Fx<E, A>) =>
  control(f)
    .on(Fail, (e) => ok(done(new Fail(e))))
    .return() as Fx<Exclude<E, Fail<any>>, A | Extract<E, Fail<any>>>
