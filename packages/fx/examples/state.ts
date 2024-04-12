import { Effect, Fx, fx, of, handle } from '../src'
import { run } from '../src/runtime/default'

type Key<K extends PropertyKey, A> = K & { readonly value: A }

class Get<K extends PropertyKey, A> extends Effect('Get')<Key<K, A>> { }
class Set<K extends PropertyKey, A> extends Effect('Set')<{ readonly key: Key<K, A>, readonly value: unknown }> { }

const get = <const K extends PropertyKey, const A>(key: Key<K, A>) =>
  new Get(key).request<A>()

const set = <const K extends PropertyKey, const A>(key: Key<K, A>, value: A) =>
  new Set({ key, value }).request<void>()

type StateEffects<M extends Record<PropertyKey, unknown>> = {
  readonly [K in keyof M]: Get<K, M[K]> | Set<K, M[K]>
}[keyof M]

const handleState = <const E, const A, S extends Record<PropertyKey, unknown>, const R>(s: S, r: (a: A, s: S) => R, f: Fx<E, A>) =>
  handle(f, {Get, Set}, {
    initially: of(s),
    handle: (gs, s) => fx(function* () {
      switch(gs.type) {
        case 'Get':
          return (gs.arg as keyof typeof s in s)
            ? [s[gs.arg as keyof typeof s], s]
            : [yield* gs as any, s]
        case 'Set':
          return [undefined, { ...s as any, [gs.arg.key as keyof typeof s]: gs.arg.value }]
      }
    }),
    return: r
  }) as Fx<Exclude<E, StateEffects<S>>, R>

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
