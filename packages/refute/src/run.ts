import { take, upto } from './iterable'
import { Series } from './series'

const defaultIterations = process.env.REFUTE_MAX_ITERATIONS ? +process.env.REFUTE_MAX_ITERATIONS : 500
const defaultDepth = process.env.REFUTE_DEPTH ? +process.env.REFUTE_DEPTH : 5

export const all = <A>(s: Series<A>, { depth = defaultDepth, iterations = defaultIterations } = {}) =>
  take(iterations, s(upto(depth)))
