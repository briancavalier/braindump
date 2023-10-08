import { randomUUID } from 'node:crypto'
import { inspect } from 'node:util'

import { isOk, string, encode, number, refine, optional, pipe, Decoded, codec, unexpected, ok, formatFail, union, decode, json, assertOk } from '../src'

type ISODateTime = string & { readonly format: 'rfc3339' }
export const isoDateTime = refine((s: string): s is ISODateTime =>
  !Number.isNaN(new Date(s).getTime()))

const stringToNumber = codec(
  (x: string) => {
    const n = Number.parseFloat(x)
    return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
  },
  (x: number) => ok(`${x}`)
)

const request = {
  userId: string,
  status: optional(union('active', 'inactive')),
  max: pipe(string, stringToNumber),
} as const

const person = {
  name: string,
  age: number
} as const

const response = {
  userId: string,
  details: person,
  date: isoDateTime,
  max: pipe(string, stringToNumber),
} as const

type Request = Decoded<typeof request>

type Response = Decoded<typeof response>

const handleRequest = (r: Request): Response =>
  ({
    userId: r.userId,
    details: {
      name: 'Dennis',
      age: 37,
      extra: 'deep extra response property'
    },
    date: new Date().toISOString() as ISODateTime,
    max: r.max,
    extra: 'extra response property'
  }) as Response // Simulating width-subtyping

const req = {
  userId: randomUUID(),
  status: 'active',
  // status: '1',
  max: '2',
  extra: 'extra request property'
}

// assert, assertOk?  decodeOrThrow too ergonomic?
const decodedReqOrFail = decode(json(request))(JSON.stringify(req))

assertOk(decodedReqOrFail)
if(!isOk(decodedReqOrFail)) throw new Error(formatFail(decodedReqOrFail))

console.log('--- request ---------------------', '\nraw', inspect(req, false, Infinity), '\ndecoded', inspect(decodedReqOrFail.value, false, Infinity), '')

const res = handleRequest(decodedReqOrFail.value)

const encodedResOrFail = encode(json(response))(res)

if (isOk(encodedResOrFail))
  console.log('\n--- response ---------------------', '\nraw', inspect(res, false, Infinity), '\nencoded', inspect(encodedResOrFail.value, false, Infinity), '')
else
  console.error('--- error ---------------------', formatFail(encodedResOrFail))
