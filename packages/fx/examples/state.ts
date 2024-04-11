import { Effect, Fx, fx, handle, pure, resumeWith, unhandled } from '../src'
import { run } from '../src/runtime/default'

type Key<K extends PropertyKey, A> = K & { readonly value: A }

type Get<K> = { readonly tag: 'get', readonly key: K }
type Set<K> = { readonly tag: 'set', readonly key: K, readonly value: unknown }

class State<K> extends Effect('State')<Get<K> | Set<K>> { }

const get = <const K extends PropertyKey, const A>(key: Key<K, A>) =>
  new State({ tag: 'get', key }).request<A>()

const set = <const K extends PropertyKey, const A>(key: Key<K, A>, value: A) =>
  new State<Key<K, A>>({ tag: 'set', key, value }).request<void>()

type Keys<M extends Record<PropertyKey, unknown>> = {
  readonly [K in keyof M]: State<Key<K, M[K]>>
}[keyof M]

type Values<E> = E extends State<infer K> ? K extends Key<PropertyKey, infer A> ? A : never : never

const handleState = <const E, const A, S extends Record<PropertyKey, unknown>, const R>(s: S, r: (a: A, s: S) => R, f: Fx<E, A>) =>
  handle(f, State, {
    initially: pure(s),
    handle: (gs, s) => {
      if(gs.tag === 'get')
        return (gs.key as keyof typeof s in s)
          ? pure(resumeWith(s[gs.key as keyof typeof s] as Values<E>, s))
          : pure(unhandled)
      else
        return pure(resumeWith(undefined, { ...s as any, [gs.key as keyof typeof s]: gs.value }))
    },
    return: r
  }) as Fx<Exclude<E, Keys<S>>, R>

const withState = <const E, const A, S extends Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) => handleState(s, (a, s) => [a, s] as const, f)
const runState = <const E, const A, S extends Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) => handleState(s, a => a, f)
const getState = <const E, const A, S extends Record<PropertyKey, unknown>>(s: S, f: Fx<E, A>) => handleState(s, (_, s) => s, f)

const key = <A>() => <const K extends PropertyKey>(key: K) => key as Key<K, A>

const main = fx(function* () {
  const k = key<number>()('k')
  const x0 = yield* get(k)
  yield* set(k, x0 + 1)
  const x1 = yield* get(k)
  yield* set(k, x1 + 1)
  const x2 = yield* get(k)
  return [x0, x1, x2]
})

const m1 = runState({ x: 1 }, main)
const m2 = runState({ k: 2 }, m1)

run(m2).then(console.log)
