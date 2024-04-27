import { EffectType, FxIterable } from '../fx'

export type AnyHandler = {
  initially?: FxIterable<unknown, unknown>
  handle: (e: any, s: any) => FxIterable<unknown, unknown>
  return?: (r: any, s: any) => unknown
  finally?: (s: any) => FxIterable<unknown, unknown>
}

export type HandlerContext = {
  effects: readonly EffectType[]
  handler: AnyHandler
  state: unknown
  forkable: boolean
}
