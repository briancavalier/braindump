import { Effect, Fx, fx, ok } from '../fx'
import { handle, resume } from '../handler'

// void | E allows the arg to be omitted while
// still exposing E in the return type
export class Get<E extends Record<PropertyKey, unknown>> extends Effect('fx/Env.Get')<void | E, Readonly<E>> { }

export const get = <const E extends Record<PropertyKey, unknown>>() =>
  new Get<E>().send()

type ExcludeEnv<E, S> =
  E extends Get<Record<PropertyKey, unknown>>
    ? S extends E['R'] ? never
    : S extends Record<PropertyKey, unknown>
      ? Get<{ readonly [K in keyof E['R'] as S[K] extends E['R'][K] ? never : K]: E['R'][K] }>
      : E
  : E

export const provide = <const S extends Record<PropertyKey, unknown>>(s: S) => <const E, const A>(f: Fx<E, A>) =>
  handle(f, {
    effects: [Get],
    initially: ok(s),
    handle: (_, s) => fx(function* () {
      return resume({ ...(yield* get()), ...s }, s)
    })
  }) as Fx<ExcludeEnv<E, S>, A>

export type EnvOf<E> = U2I<EachEnv<E>>
type EachEnv<E> = E extends Get<infer A> ? A : never

export const provideAll = <const S extends Record<PropertyKey, unknown>>(s: S) => <const E, const A>(f: Fx<CheckEnv<S, E>, A>) =>
  handle(f, {
    effects: [Get],
    initially: ok(s),
    handle: (_, s) => ok(resume(s, s))
  }) as Fx<ExcludeEnv<E, S>, A>

type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type CheckEnv<S, E> = E extends Get<infer A> ? S extends A ? E : { error: 'Missing Env', missing: { readonly [K in Exclude<keyof A, keyof S>]: A[K] } } : E
