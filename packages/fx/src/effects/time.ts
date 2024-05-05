import { Effect, Fx, ok } from '../fx'
import { Handler } from '../handler/Temp'

export class Now extends Effect<'fx/Time', void, number> { }

export const now = new Now()

export const builtinDate = <const E, const A>(f: Fx<E, A>) =>
  Handler
    .on(Now, () => ok(Handler.resume(Date.now())))
    .handle(f)
