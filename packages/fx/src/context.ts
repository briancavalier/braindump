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
}

let contextStack = [] as Context[]

export const getContext = () => contextStack

export const setContext = (s: Context[]) => {
  contextStack = s
}

export const pushContext = (c: Context) =>
  contextStack.push(c)

export const popContext = () =>
  contextStack.pop()
