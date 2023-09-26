import { inspect } from 'node:util'

import { isOk, string, encode, number, decode, refine, optional, json, pipe, object, lift, arrayOf, Decoded, boolean, codec, unexpected, ok, printFail, union, printSchema } from './src'

type ISODateTime = string & { readonly format: 'rfc3339' }
export const isoDateTime = refine((s: string): s is ISODateTime =>
  !Number.isNaN(new Date(s).getTime()))

const person = {
  name: string,
  age: number
} as const

const thing = union({
  type: 'a',
  a: number
}, {
  type: 'b',
  b: string
})

const stringToNumber = codec(
  (x: string) => {
    const n = Number.parseFloat(x)
    return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
  },
  (x: number) => ok(`${x}`)
)

const request = {
  a: optional(number),
  b: union(string, number),
  person: person,
  thing: thing,
  date: isoDateTime,
  max: pipe(string, stringToNumber),
  ids: arrayOf(number),
  tuple: [string, number, boolean],
}

type DecodedRequest = Decoded<typeof request>

const req = JSON.stringify({
  a: 1,
  b: true,
  person: {
    name: 'Dennis',
    // age: 37,
    extra: 'kljsdf'
  },
  thing: { type: 'c' },
  date: new Date().toISOString(),
  // max: '2',
  ids: [1, 2, 3],
  tuple: ['', 2, false],
  extra: '123'
})

console.log(printSchema(request))

const requestCodec = pipe(json, object, lift(request))

const r = decode(requestCodec)(req)
console.log(inspect(r, false, Infinity))

if(isOk(r)) {
  const r2 = encode(requestCodec)({ ...r.value, extra: '123' })
  console.log(inspect(r2, false, Infinity))
} else {
  console.log(printFail(r))
}
