import { Effect, Fx, fx, isEffect } from './fx'

export class Fail<const E> extends Effect('Fail')<E> { }

type Failures<E> = E extends Fail<infer A> ? A : never

export const fail = <const E>(e: E) => new Fail(e).request<never>()

export const catchIf = <const E, const A, const F>(
  e: (x: unknown) => x is F,
  f: Fx<E, A>
) => fx(function* () {
  const i = f[Symbol.iterator]()
  let ir = i.next()
  while (!ir.done) {
    if (isEffect(Fail, ir.value) && e(ir.value.arg)) return ir.value.arg
    else ir = i.next(yield ir.value as any)
  }
  return ir.value
}) as Fx<Exclude<E, Fail<F>>, A | Failures<E>>

// TODO: implement defer
// or allow arbitrary type guard (instead of constructor) in handle3
// export const catchIf2 = <const E, const A, const F>(
//   e: (x: unknown) => x is F,
//   f: Fx<E, A>
// ) => handle3(f, Fail, {
//     // eslint-disable-next-line require-yield
//     handle: fail => fx(function* () {
//       if (e(fail.arg)) return done(fail.arg)
//       return yield* fail
//     })
//   })
