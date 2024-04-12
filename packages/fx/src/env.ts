import { Effect, Fx, fx, of } from './fx'
import { handle } from './handle'

export class Env<E extends Record<PropertyKey, unknown>> extends Effect('Env')<E> { }

export const env = <const E extends Record<PropertyKey, unknown>>() =>
  new Env<E>(undefined as never).request<E>()

type ExcludeEnv<E, S> =
  E extends Env<infer A extends Record<PropertyKey, unknown>>
    ? S extends A
      ? never
  : S extends Record<PropertyKey, unknown> ? Env<{ readonly [K in keyof A as S[K] extends A[K] ? never : K]: A[K] }> : E
  : E

export const withEnv = <const E, const A, const S extends Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) =>
  handle(f, { Env }, {
    initially: of(s),
    handle: (_, s) => fx(function* () {
      return [{ ...(yield* env<Record<string, unknown>>()), ...s }, s]
    })
  }) as Fx<ExcludeEnv<E, S>, A>

export type EnvOf<E> = U2I<EachEnv<E>>
type EachEnv<E> = E extends Env<infer A> ? A : never

export const isolateEnv = <const E, const A, const S extends EnvOf<E>>(s: S, f: Fx<E, A>) =>
  handle(f, { Env }, {
    initially: of(s),
    handle: (_, s) => of([s, s])
  }) as Fx<ExcludeEnv<E, S>, A>

type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
