import { inspect } from 'node:util'

import { isOk, string, encode, number, schemaCodec, json, pipe, decode, refine, Json, Decoded } from './src'

type ISODateTime = string & { readonly format: 'rfc3339' }
export const isoDateTime = refine((s: string): s is ISODateTime =>
  Number.isNaN(new Date(s).getTime()))

const person = {
  name: string,
  age: number
} as const

const request = {
  body: pipe(json, refine((x: Json): x is { readonly [k: string]: Json } => !!x && typeof x === 'object'), schemaCodec(person)),
  queryStringParameters: {
    date: isoDateTime
  }
} as const

type Request = Decoded<typeof request>

const req = {
  body: JSON.stringify({ name: 'Dennis', age: 37 }),
  queryStringParameters: {
    date: new Date().toISOString()
  }
}

const r = decode(request)(req)
console.log(inspect(r, false, Infinity))

if(isOk(r)) {
  const r2 = encode(request)(r.value)
  console.log(inspect(r2, false, Infinity))
}
