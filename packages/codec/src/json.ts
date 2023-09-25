
import { Ok, Fail, ok, thrown } from './result'
import { codec } from './schema'

export type Json = null | number | string | boolean | readonly Json[] | { readonly [k: string]: Json }

export const jsonParse = (s: string): Ok<Json> | Fail => {
  try {
    return ok(JSON.parse(s))
  } catch(e) {
    return thrown(s, e)
  }
}

export const jsonStringify = (x: Json): Ok<string> | Fail => {
  try {
    return ok(JSON.stringify(x))
  } catch(e) {
    return thrown(x, e)
  }
}

export const json = codec(jsonParse, jsonStringify)
