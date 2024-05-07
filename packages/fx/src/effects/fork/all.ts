import { Fx, fx } from '../../fx'
import { Async } from '../async'
import { Fail } from '../fail'

import { Process, all as processAll } from './process'
import { EffectsOf, ErrorsOf, Fork, ResultOf, fork } from './temp'

export const all = <Fxs extends readonly Fx<unknown, unknown>[]>(...fxs: Fxs) => fx(function* () {
  const ps = [] as Process<unknown, unknown>[]
  for (const f of fxs) ps.push(yield* fork(f))
  return processAll(...ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>> | Fork, Process<{
  readonly [K in keyof Fxs]: ResultOf<Fxs[K]>
}, ErrorsOf<EffectsOf<Fxs[number]>>>>
