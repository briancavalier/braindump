import { Effect, Fx, fx, ok } from '../fx'
import { handle, } from '../handler'

// void | E allows the arg to be omitted while
// still exposing E in the return type
export class Get<E extends Record<PropertyKey, unknown>> extends Effect('fx/Env')<void, Readonly<E>> { }

export const get = <const E extends Record<PropertyKey, unknown>>() =>
  new Get<E>().returning<E>()

type ExcludeEnv<E, S> =
  E extends Get<Record<PropertyKey, unknown>>
    ? S extends E['R'] ? never
    : S extends Record<PropertyKey, unknown>
      ? Get<{ readonly [K in keyof E['R'] as S[K] extends E['R'][K] ? never : K]: E['R'][K] }>
      : E
  : E

export const provide = <const S extends Record<PropertyKey, unknown>>(s: S) => <const E, const A>(f: Fx<E, A>) =>
  f.pipe(
    handle(Get, () => fx(function* () {
      return { ...(yield* get()), ...s }
      }))
  ) as Fx<ExcludeEnv<E, S>, A>

export type EnvOf<E> = U2I<EachEnv<E>>
type EachEnv<E> = E extends Get<infer A> ? A : never

export const provideAll = <const S extends Record<PropertyKey, unknown>>(s: S) => <const E, const A>(f: Fx<CheckEnv<S, E>, A>) =>
  f.pipe(
    handle(Get, () => ok(s))
  ) as Fx<ExcludeEnv<E, S>, A>

type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

interface TypeError<Message extends string, Context> {
  message: Message,
  context: Context
  readonly _: unique symbol
}

type CheckEnv<S, E> = E extends Get<infer A> ? S extends A ? E
  : TypeError<'provideAll missing required elements', { readonly [K in Exclude<keyof A, keyof S>]: A[K] }>
  : E
