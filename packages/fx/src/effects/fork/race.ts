import { Fx, fx } from '../../fx'
import { Async } from '../async'
import { Fail } from '../fail'

import { Process, race as processRace } from './process'
import { EffectsOf, ErrorsOf, Fork, ResultOf, fork } from './temp'

export const race = <Fxs extends readonly Fx<unknown, unknown>[]>(...fxs: Fxs) => fx(function* () {
  const ps = [] as Process<unknown, unknown>[]
  for (const f of fxs) ps.push(yield* fork(f))
  return processRace(...ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>> | Fork, Process<ResultOf<Fxs[number]>, ErrorsOf<EffectsOf<Fxs[number]>>>>
