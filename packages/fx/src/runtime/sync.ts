import { provideAll } from '../env'
import { Fx } from '../fx'

export const run = <const R>(f: Fx<never, R>): R =>
  provideAll({}, f)[Symbol.iterator]().next().value
