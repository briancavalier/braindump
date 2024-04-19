import { Effect, Fx, ok } from './fx'
import { handle, resume } from './handler'

export class Now extends Effect('fx/Time.Now')<void, number> { }

export const now = new Now().send()

export const builtinDate = <const E, const A>(f: Fx<E, A>) => handle(f, [Now], {
  handle: () => ok(resume(Date.now()))
})
