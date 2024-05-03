import { Effect, Fx, ok } from '../fx'
import { handle } from '../handler/Handler'
import { resume } from '../handler/Step'

export class Now extends Effect('fx/Time/Now')<void, number> { }

export const now = new Now().send()

export const builtinDate = <const E, const A>(f: Fx<E, A>) => handle(f)
  .on(Now, () => ok(resume(Date.now())))
  .return()
