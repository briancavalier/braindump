import { EffectType, FxIterable } from "../fx"

import { StateVar } from './internal/state'

export type HandlerContext = Readonly<{
  handler: AnyHandler
  state: StateVar
  forkable: boolean
}>

export type AnyHandler = Readonly<{
  effects: readonly EffectType[]
  initially?: undefined | FxIterable<unknown, unknown>
  handle: (e: any, s: any) => FxIterable<unknown, unknown>
  return?: undefined | ((r: any, s: any) => unknown)
  finally?: undefined | ((s: any) => FxIterable<unknown, unknown>)
}>
