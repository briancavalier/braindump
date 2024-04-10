import { Fx } from '../fx'

export const run = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value
