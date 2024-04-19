import { Async } from './async'
import { Fork } from './concurrent/fork'
import { Process } from './concurrent/process'
import { spawn } from './concurrent/unbounded'
import { provideAll } from './env'
import { Fx } from './fx'

export const async = <const R>(f: Fx<Async | Fork, R>): Process<R> =>
  spawn(provideAll({}, f))

export const sync = <const R>(f: Fx<never, R>): R =>
  getResult(provideAll({}, f))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
