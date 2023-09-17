
import { codec } from './codec'
import { decode } from './decode'
import { encode } from './encode'
import { Ok, Fail, ok, isOk } from './result'
import { Decoded } from './schema'

export type Json = null | number | string | boolean | readonly Json[] | { readonly [k: string]: Json }

export const json = <S>(s: S) => codec(decodeJson(s), encodeJson(s))

export const decodeJson = <S>(schema: S) => (s: string): Ok<Decoded<S>> | Fail => {
  const r = jsonParse(s)
  return isOk(r) ? decode(schema)(r.value as any) : r
}

export const encodeJson = <S>(schema: S) => (x: Decoded<S>): Ok<string> | Fail => {
  const r = encode(schema)(x)
  return isOk(r) ? jsonStringify(r.value as any) : r
}

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

export const invalidJson = <T, I, E>(type: T, input: I, error: E) => ({ type, input, error }) as const
