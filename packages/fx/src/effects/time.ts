import { Effect, ok } from '../fx'
import { handle } from '../handler'

export class Now extends Effect('fx/Time')<void, number> { }

export const now = new Now()

export const builtinDate = handle(Now, () => ok(Date.now()))
