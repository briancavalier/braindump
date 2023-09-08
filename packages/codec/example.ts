import { inspect } from 'node:util'

import { isOk, ok, codec, decode, pipe, string, encode, unexpected, number } from './src'
import { jsonCodec } from './src/json'

export const date = pipe(string, codec(
  (s: string) => {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? unexpected('date', s) : ok(d)
  },
  (d: Date) => ok(d.toISOString())
))

const person = {
  name: string,
  age: number
} as const

const request = {
  body: jsonCodec(person),
  queryStringParameters: {
    date: date
  }
} as const

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
