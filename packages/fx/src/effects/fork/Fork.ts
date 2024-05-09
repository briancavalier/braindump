import { Effect, Fx, fx } from '../../fx'
import { HandlerContext } from '../../handler/HandlerContext'
import { Async } from '../async'
import { Fail } from '../fail'

import * as T from './Task'

export class Fork extends Effect<'fx/Fork', ForkContext, T.Task<unknown, unknown>> { }

export const fork = <const E, const A>(fx: Fx<E, A>, name: string = 'anonymous') =>
  new Fork({ fx, context: [], name }) as Fx<Exclude<E, Async | Fail<any>> | Fork, T.Task<A, ErrorsOf<E>>>

export type ForkContext = Readonly<{
  name: string
  fx: Fx<unknown, unknown>
  context: readonly HandlerContext[]
}>

export type EffectsOf<F> = F extends Fx<infer E, unknown> ? E : never
export type ResultOf<F> = F extends Fx<unknown, infer A> ? A : never
export type ErrorsOf<E> = Extract<E, Fail<any>>

export const all = <const Fxs extends readonly Fx<unknown, unknown>[]>(fxs: Fxs, name = 'all') => fx(function* () {
  const ps = [] as T.Task<unknown, unknown>[]
  for (let i = 0; i < fxs.length; i++) ps.push(yield* fork(fxs[i], `${name}:${i}`))
  return T.all(ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>> | Fork, T.Task<{
  readonly [K in keyof Fxs]: ResultOf<Fxs[K]>
}, ErrorsOf<EffectsOf<Fxs[number]>>>>

export const race = <const Fxs extends readonly Fx<unknown, unknown>[]>(fxs: Fxs, name = 'race') => fx(function* () {
  const ps = [] as T.Task<unknown, unknown>[]
  for (let i = 0; i < fxs.length; i++) ps.push(yield* fork(fxs[i], `${name}:${i}`))
  return T.race(ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>> | Fork, T.Task<ResultOf<Fxs[number]>, ErrorsOf<EffectsOf<Fxs[number]>>>>
