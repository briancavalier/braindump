import { Async } from './async'
import { Fork, fork, spawn } from './concurrent/fork'
import { Process } from './concurrent/process'
import { getContext } from './context'
import { Env } from './env'
import { Fx, ok } from './fx'
import { handle, resume } from './handler'
import { Now } from './time'

export const async = <const R>(f: Fx<Async | Fork | Now, R>): Process<R> =>
  getResult(platform(fork(f)))

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(handle(f, { Env }, { handle: () => ok(resume({})) }))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value

const platform = <const E, const A>(f: Fx<E, A>) => handle(f, { Now, Env, Fork }, {
  // eslint-disable-next-line require-yield
  *handle(e) {
    switch (e.tag) {
      case 'Now': return resume(Date.now())
      case 'Env': return resume({})
      case 'Fork': return resume(spawn(e.arg, [...getContext()]))
    }
  }
})
