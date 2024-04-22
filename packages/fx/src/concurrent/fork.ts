import { type Async } from '../async'
import { Context } from '../context'
import { type Fail } from '../fail'
import { Effect, Fx } from '../fx'

import { Process } from './process'

export class Fork extends Effect('fx/Fork.Fork')<Fx<unknown, unknown>, Process<unknown, unknown>> {
  constructor(f: Fx<unknown, unknown>, public readonly context: readonly Context[]) { super(f) }
}

export const fork = <const E, const A>(f: Fx<E, A>) =>
  new Fork(f, []).send() as Fx<Exclude<E, Async | Fail<any>> | Fork, Process<A, Errors<E>>>

type Errors<E> = E extends Fail<infer F> ? F : never
