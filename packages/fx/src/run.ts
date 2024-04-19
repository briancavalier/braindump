import { Async } from './async'
import { Fork } from './concurrent/fork'
import { Process } from './concurrent/process'
import { spawn } from './concurrent/unbounded'
import { provideAll } from './env'
import { Fx, map } from './fx'
import { pipe } from './pipe'

export const async = <const R>(f: Fx<Async | Fork, R>): Process<R> =>
  pipe(provideAll({}, f), map(([r]) => r), spawn)

export const sync = <const R>(f: Fx<never, R>): R =>
  pipe(provideAll({}, f), map(([r]) => r), getResult)

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
