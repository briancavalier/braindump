import { Effect, Fx } from '../../fx'
import { HandlerContext } from '../../handler/HandlerContext'
import { Async } from '../async'
import { Fail } from '../fail'

import { Process } from './process'

export class Fork extends Effect<'fx/Fork', ForkContext, Process<unknown, unknown>> { }

export const fork = <const E, const A>(fx: Fx<E, A>) => new Fork({ fx, context: [] }) as Fx<Exclude<E, Async | Fail<any>> | Fork, Process<A, Errors<E>>>

export type ForkContext = Readonly<{
  fx: Fx<unknown, unknown>
  context: readonly HandlerContext[]
}>

export type EffectsOf<F> = F extends Fx<infer E, unknown> ? E : never
export type ResultOf<F> = F extends Fx<unknown, infer A> ? A : never
export type Errors<E> = E extends Fail<infer F> ? F : never
