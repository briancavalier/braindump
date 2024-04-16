import { Async } from './async'
import { Concurrent, fork, spawn } from './concurrent/fork'
import { Process } from './concurrent/process'
import { getContext } from './context'
import { Env } from './env'
import { Fx, ok } from './fx'
import { handle, match } from './handler'
import { Now } from './time'

export const async = <const R>(f: Fx<Async | Concurrent | Now, R>): Process<R> =>
  getResult(platform(fork(f)))

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(handle(f, { Env }, { handle: () => ok({}) }))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value

const platform = <const E, const A>(f: Fx<E, A>) => handle(f, { Now, Env, Concurrent }, {
  // eslint-disable-next-line require-yield
  *handle(e) {
    if (match(Now, e)) return Date.now()
    if (match(Env, e)) return {}
    if (match(Concurrent, e)) return spawn(e.arg, [...getContext()])
  }
})
