import { Effect, Fx, ok } from '../fx'
import { Handler } from '../handler/Handler'

export class Now extends Effect('fx/Time/Now')<void, number> { }

export const now = new Now().send()

export const builtinDate = <const E, const A>(f: Fx<E, A>) =>
  Handler
    .on(Now, () => ok(Handler.resume(Date.now())))
    .handle(f)
