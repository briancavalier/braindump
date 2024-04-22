import { Effect, Fx, ok } from './fx'
import { control, done, resume } from './handler'

export class Fail<const E> extends Effect('fx/Fail.Fail')<E, never> { }

export type Failures<E> = E extends Fail<infer A> ? A : never

export const fail = <const E>(e: E) => new Fail(e).send()

export const catchIf = <const E, const A, const F>(
  match: (x: unknown) => x is F,
  f: Fx<E, A>
) => control(f, [Fail], {
  *handle(e) {
    return match(e.arg) ? done(e.arg) : resume(yield* e as any)
  }
}) as Fx<Exclude<E, Fail<F>>, A | Failures<E>>

export const catchAll = <const E, const A>(
  f: Fx<E, A>
) => control(f, [Fail], {
  handle: (e) => ok(done(e.arg))
}) as Fx<Exclude<E, Fail<any>>, A | Failures<E>>
