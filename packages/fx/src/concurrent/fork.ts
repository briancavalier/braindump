import { Async } from '../async'
import { Context } from '../context'
import { Effect, Fx } from '../fx'

import { Process } from './process'

export class Fork extends Effect('fx/Fork.Fork')<Fx<unknown, unknown>, Process<unknown>> {
  constructor(f: Fx<unknown, unknown>, public readonly context: readonly Context[]) { super(f) }
}

export const fork = <const E, const A>(f: Fx<E, A>) =>
  new Fork(f, []).send() as Fx<Exclude<E, Async> | Fork, Process<A>>
