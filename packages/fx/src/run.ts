import { Async } from './effects/async'
import { provideAll } from './effects/env'
import { Fork, runFork } from './effects/fork'
import { Task } from './effects/fork/Task'
import { Semaphore } from './effects/fork/semaphore'
import { Fx } from './fx'

export const async = <const R>(f: Fx<Fork | Async, R>): Task<R, never> =>
  runFork(f.pipe(provideAll({})), new Semaphore(Infinity), 'async:main')

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(f.pipe(provideAll({})))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
