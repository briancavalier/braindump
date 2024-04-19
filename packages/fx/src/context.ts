import { EffectType, Fx } from './fx'

type AnyHandler = {
  initially?: Fx<unknown, unknown>
  handle: (e: any, s: any) => Fx<unknown, unknown>
  return?: (r: any, s: any) => unknown
  finally?: (s: any) => Fx<unknown, unknown>
}

export type Context = {
  effects: Record<PropertyKey, EffectType>
  handler: AnyHandler
  state: unknown
}
