import { Async } from './async'
import { Fork } from './concurrent/fork'
import { Process } from './concurrent/process'
import { Semaphore } from './concurrent/semaphore'
import { schedule } from './concurrent/unbounded'
import { provideAll } from './env'
import { Fx } from './fx'

export const async = <const R>(f: Fx<Fork | Async, R>): Process<R, never> =>
  schedule(provideAll({}, f), new Semaphore(Infinity))

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(provideAll({}, f))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
