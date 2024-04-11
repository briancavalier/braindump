import { Effect, Fx, fx, handle, pure, resumeWith } from '../src'
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

const handleState = <const E, const A, M extends Record<PropertyKey, unknown>>(m: M, f: Fx<E, A>) =>
  handle(f, State, {
    initially: pure(m),
    handle: (s, m) => pure(
      s.tag === 'get' ? resumeWith(m[s.key as keyof typeof m] as A, m)
      : resumeWith(undefined, { ...m as any, [s.key as keyof typeof m]: s.value })
    )
  }) as Fx<Exclude<E, Keys<M>>, Values<E>>

const ref = <const K extends PropertyKey, A>(key: K, value: A) => fx(function*() {
  yield* set(key as Key<K, A>, value)
  return key as Key<K, A>
})

const main = fx(function* () {
  const k = yield* ref('k', 0)
  const x0 = yield* get(k)
  yield* set(k, x0 + 1)
  const x1 = yield* get(k)
  yield* set(k, x1 + 1)
  const x2 = yield* get(k)
  return [x0, x1, x2]
})

const m = handleState({ k: 1 }, main)

run(m).then(console.log)
