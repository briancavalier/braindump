
import { attempt } from './attempt'
import { decode } from './decode'
import { encode } from './encode'
import { isOk } from './result'
import { Decoded, Schema, codec } from './schema'

export type Json = null | number | string | boolean | readonly Json[] | { readonly [k: string]: Json }

export const json = <const S extends Schema>(s: S) => codec(
  (x: string) => {
    const r = jsonParse(x)
    return isOk(r) ? decode(s)(r.value as any) : r
  },
  (x: Decoded<S>) => {
    // @ts-expect-error infinite
    const r = encode(s)(x)
    return isOk(r) ? jsonStringify(r.value as any) : r
  }
)

export const jsonParse = attempt((s: string) => JSON.parse(s) as Json)
export const jsonStringify = attempt((x: Json) => JSON.stringify(x))
