import { setTimeout } from 'timers/promises'
import { inspect } from 'util'

import { Async, Effect, Fork, Fx, Run, fx, handle, map, ok, resume } from '../src'

// The usual state monad, as an effect
class Get<A> extends Effect<'State', void, A> { }
class Set<A> extends Effect<'State', A, void> { }

const get = <const A>() => new Get<A>()
const set = <const A>(value: A) => new Set(value)

// const withState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, (a, s) => [a, s] as const, f)
const runState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, a => a, f)
// const getState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, (_, s) => s, f)

const handleState = <const E, const A, const R, const S = StateOf<E>>(s: S, r: (a: A, s: S) => R, f: Fx<E, A>) => fx(function* () {
  let state = s
  return yield* f.pipe(
    handle(Get, () => ok(resume(state))),
    handle(Set, newState => {
      state = newState as S
      return ok(resume(undefined))
    }),
    map(a => r(a, state))
  ) as Fx<Exclude<E, Get<StateOf<E>> | Set<StateOf<E>>>, R>
})

type StateOf<E> = U2I<_StateOf<E>>
type _StateOf<E> = E extends Get<infer S> | Set<infer S> ? S : never
type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

const delay = (ms: number) => Async.run(
  signal => setTimeout(ms, undefined, { signal })
)

const f = fx(function* () {
  const x0 = yield* get<number>()
  yield* set(x0 + 1)
  yield* delay(1)
  const x1 = yield* get<number>()
  yield* set(x1 + 1)
  yield* delay(1)
  const x2 = yield* get<number>()
  return [x0, x1, x2]
})

const main1 = fx(function* () {
  const r1 = yield* Fork.all([f, f])
  const r3 = yield* Async.wait(r1)
  return r3
})

const main2 = fx(function* () {
  const r1 = yield* Fork.all([runState(1, f), runState(1, f)], 'concurrent state')
  const r3 = yield* Async.wait(r1)
  return r3
})

const main = fx(function* () {
  return {
    // Sharing state
    shared: yield* runState(1, main1),
    // Isolated state
    isolated: yield* main2
  }
})

Run.async(main).promise.then(x => console.log(inspect(x, false, Infinity)))
