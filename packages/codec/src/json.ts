
import { attempt } from './attempt'
import { codec } from './schema'

export type JsonValue = null | number | string | boolean | readonly JsonValue[] | { readonly [k: string]: JsonValue }

export const jsonParse = attempt((s: string) => JSON.parse(s) as JsonValue)
export const jsonStringify = attempt(JSON.stringify as (a: JsonValue) => string)

export const json = codec(jsonParse, jsonStringify)
