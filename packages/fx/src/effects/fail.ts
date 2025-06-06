import { Effect } from '../Effect'
import { Fx, fx, ok } from '../fx'
// eslint-disable-next-line import/no-cycle
import { control } from '../handler'

export class Fail<const E> extends Effect('fx/Fail')<E, never> { }

export const fail = <const E>(e: E) => new Fail(e)

export const catchIf = <const F>(match: (x: unknown) => x is F) =>
  <const E, const A>(f: Fx<E, A>) =>
    f.pipe(
      control(Fail, (resume, e) => fx(function* () {
        return match(e) ? e : resume(yield* fail(e))
      }))
    ) as Fx<Exclude<E, Fail<F>>, A | UnwrapFail<E>>

export const catchAll = <const E, const A>(f: Fx<E, A>) =>
  f.pipe(
    control(Fail, (_, e) => ok(e))
  ) as Fx<Exclude<E, Fail<any>>, A | UnwrapFail<E>>

export const catchFail = <const E, const A>(f: Fx<E, A>) =>
  f.pipe(
    control(Fail, (_, e) => ok(new Fail(e)))
   ) as Fx<Exclude<E, Fail<any>>, A | Extract<E, Fail<any>>>

type UnwrapFail<F> = F extends Fail<infer E> ? E : never
