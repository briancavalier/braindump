import { inspect } from 'util'

import { Async, Effect, Fork, Fx, Handler, Process, Run, fx, ok } from '../src'

class Get<A> extends Effect('Get')<void, A> { }
class Set<A> extends Effect('Set')<A, void> { }

const get = <const A>() => new Get<A>().send()
const set = <const A>(value: A) => new Set(value).send()

// const withState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, (a, s) => [a, s] as const, f)
const runState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, a => a, f)
// const getState = <const E, const A>(s: StateOf<E>, f: Fx<E, A>) => handleState(s, (_, s) => s, f)

const handleState = <const E, const A, const R, const S = StateOf<E>>(s: S, r: (a: A, s: S) => R, f: Fx<E, A>) =>
  Handler.handle(f, [Get, Set], {
    initially: ok(s),
    // eslint-disable-next-line require-yield
    handle(gs, s) {
      switch(gs.id) {
        case 'Get': return ok(Handler.resume(s, s))
        case 'Set': return ok(Handler.resume(undefined, gs.arg as S))
      }
    },
    return: r
  }) as Fx<Exclude<E, Get<StateOf<E>> | Set<StateOf<E>>>, R>

type StateOf<E> = U2I<_StateOf<E>>
type _StateOf<E> = U2I<E extends Get<infer S> | Set<infer S> ? S : never>
type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

const f = fx(function* () {
  const x0 = yield* get<number>()
  yield* set(x0 + 1)
  const x1 = yield* get<number>()
  yield* set(x1 + 1)
  const x2 = yield* get<number>()
  return [x0, x1, x2]
})

const main = fx(function* () {
  const x0 = yield* get<number>()
  yield* set(x0 + 1)
  const r1 = yield* Fork.fork(f)
  const r2 = yield* Fork.fork(f)
  const r3 = yield* Async.wait(Process.all(r1, r2))
  return r3
})

// const m1 = withState(1, main)
const m1 = runState(1, main)
// const m1 = getState(1, main)

Run.async(m1).promise.then(x => console.log(inspect(x, false, Infinity)))
