import { FxIterable } from '../fx'

export type AnyHandler = {
  initially?: undefined | FxIterable<unknown, unknown>
  handle: (e: any, s: any) => FxIterable<unknown, unknown>
  return?: undefined | ((r: any, s: any) => unknown)
  finally?: undefined | ((s: any) => FxIterable<unknown, unknown>)
}
