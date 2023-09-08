import { Ok, Fail, ok, codec, Schema, isOk, decode, Decoded, encode, Codec } from '.'

export type Json = null | number | string | boolean | readonly Json[] | { readonly [k: string]: Json }

export const jsonCodec = <const S>(s: S): Codec<string, Decoded<S>> => codec(decodeJson(s as any), encodeJson(s as any))

export const decodeJson = <const S>(s: S) => (x: string): Ok<Decoded<S>> | Fail => {
  try {
    return decode(s)(JSON.parse(x))
  } catch (e) {
    return unparseableJson(s, x, e)
  }
}

export const encodeJson = <S extends Schema>(s: S) => (x: Decoded<S>): Ok<string> | Fail => {
  // @ts-expect-error ts(2859) infinite recursion
  const r = encode(s)(x)
  return isOk(r)
    // @ts-expect-error ts(2859) infinite recursion
    ? ok(JSON.stringify(r.value))
    : r
}

export const unparseableJson = <S>(schema: S, input: string, error: unknown) => ({ type: 'unparseable-json', schema, input, error })
