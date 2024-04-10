import { Effect, Fx, pure } from './fx'
import { done, handle, unhandled } from './handle'

export class Fail<const E> extends Effect('Fail')<E> { }

type Failures<E> = E extends Fail<infer A> ? A : never

export const fail = <const E>(e: E) => new Fail(e).request<never>()

export const catchIf = <const E, const A, const F>(
  e: (x: unknown) => x is F,
  f: Fx<E, A>
) => handle(f, Fail, {
    handle: fail => pure(e(fail.arg) ? done(fail.arg) : unhandled)
}) as Fx<Exclude<E, Fail<F>>, A | Failures<E>>
