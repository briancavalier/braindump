import { Effect, Fx, ok } from './fx'
import { handle } from './handler'

// void | E allows the arg to be omitted while
// still exposing
export class Env<E extends Record<PropertyKey, unknown>> extends Effect('Env')<void | E, E> { }

export const get = <const E extends Record<PropertyKey, unknown>>() =>
  new Env<E>().send()

type ExcludeEnv<E, S> =
  E extends Env<Record<PropertyKey, unknown>>
    ? S extends E['R'] ? never
    : S extends Record<PropertyKey, unknown>
      ? Env<{ readonly [K in keyof E['R'] as S[K] extends E['R'][K] ? never : K]: E['R'][K] }>
      : E
  : E

export const provide = <const E, const A, const S extends Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) =>
  handle(f, { Env }, {
    initially: ok(s),
    *handle(_, s) {
      return [{ ...(yield* get()), ...s }, s]
    }
  }) as Fx<ExcludeEnv<E, S>, A>

export type EnvOf<E> = U2I<EachEnv<E>>
type EachEnv<E> = E extends Env<infer A> ? A : never

export const provideAll = <const E, const A, const S extends EnvOf<E> & Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) =>
  handle(f, { Env }, {
    initially: ok(s),
    handle: (_, s) => ok([s, s])
  }) as Fx<ExcludeEnv<E, S>, A>

type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
