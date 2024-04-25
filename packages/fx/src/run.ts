import { Async } from './effects/async'
import { provideAll } from './effects/env'
import { Fork, schedule } from './effects/fork/fork'
import { Process } from './effects/fork/process'
import { Semaphore } from './effects/fork/semaphore'
import { Fx } from './fx'

export const async = <const R>(f: Fx<Fork | Async, R>): Process<R, never> =>
  schedule(f.pipe(provideAll({})), new Semaphore(Infinity))

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(f.pipe(provideAll({})))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
