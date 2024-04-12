import { Effect, Fx, fx, of, handle } from '../src'
import { run } from '../src/runtime/default'

class Env<E extends Record<PropertyKey, unknown>> extends Effect('Env')<E> { }

const env = <E extends Record<PropertyKey, unknown>>() =>
  new Env<E>(undefined as never).request<E>()

type ExcludeEnv<E, S extends Record<PropertyKey, unknown>> = E extends Env<infer A extends Record<PropertyKey, unknown>>
  ? S extends A
    ? never
    : Env<{ readonly [K in keyof A as S[K] extends A[K] ? never : K]: A[K] }>
  : E

const handleEnv = <const E, const A, S extends Record<PropertyKey, unknown>>(s: S, root: boolean, f: Fx<E, A>) =>
  handle(f, { Env }, {
    initially: of(s),
    handle: (_, s) => fx(function* () {
      return root ? [s, s] : [{ ...(yield* env<Record<string, unknown>>()), ...s }, s]
    })
  }) as Fx<ExcludeEnv<E, S>, A>

const main = fx(function* () {
  const { x, y } = yield* env<{ x: number, y: string }>()
  console.log(x, y)
})

const m1 = handleEnv({ x: 1 }, false, main)
const m2 = handleEnv({ y: 'hello' }, true, m1)

run(m2).then(console.log)
