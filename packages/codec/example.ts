import { inspect } from 'node:util'

import { isOk, string, encode, number, json, decode, refine, Decoded, optional } from './src'

type ISODateTime = string & { readonly format: 'rfc3339' }
export const isoDateTime = refine((s: string): s is ISODateTime =>
  !Number.isNaN(new Date(s).getTime()))

const person = {
  name: string,
  age: number
} as const

const request = {
  body: json(person),
  queryStringParameters: {
    date: isoDateTime,
    max: optional(number, 1)
  }
}

type Request = Decoded<typeof request>

const req = {
  body: JSON.stringify({ name: 'Dennis', age: 37 }),
  queryStringParameters: {
    date: new Date().toISOString(),
    // max: 2
  }
}

const r = decode(request)(req)
console.log(inspect(r, false, Infinity))

if(isOk(r)) {
  const r2 = encode(request)(r.value)
  console.log(inspect(r2, false, Infinity))
}
