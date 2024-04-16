import { Async } from './async'
import { Concurrent, withUnboundedConcurrency, fork } from './concurrent/fork'
import { Process } from './concurrent/process'
import { provideAll } from './env'
import { Fx } from './fx'

export const async = <const R>(f: Fx<Async | Concurrent, R>): Process<R> =>
  getResult(withUnboundedConcurrency(fork(provideAll({}, f))))


export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(provideAll({}, f))


const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
