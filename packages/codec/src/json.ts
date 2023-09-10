
import { codec } from './codec'
import { Ok, Fail, ok } from './result'

export type Json = null | number | string | boolean | readonly Json[] | { readonly [k: string]: Json }

export const jsonParse = (s: string): Ok<Json> | Fail => {
  try {
    return ok(JSON.parse(s))
  } catch(e) {
    return invalidJson('json:unparseable', s, e)
  }
}

export const jsonStringify = (x: Json): Ok<string> | Fail => {
  try {
    return ok(JSON.stringify(x))
  } catch(e) {
    return invalidJson('json:unstringifiable', x, e)
  }
}

export const json = codec(jsonParse, jsonStringify)

export const invalidJson = <T, I, E>(type: T, input: I, error: E) => ({ type, input, error }) as const
