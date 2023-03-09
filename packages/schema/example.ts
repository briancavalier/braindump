import { inspect } from 'node:util'

import { Infer, map, array, decode, encode, isOk, number, ok, string, unexpected, union } from './src'

const dateSchema = map(string,
  s => {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? unexpected('ISO datetime string', s) : ok(d)
  },
  d => ok(d.toISOString())
)

const s = {
  name: string,
  age: number,
  addresses: array({
    street: string,
    apartment: union(string, undefined) // optional
  }),
  dateOfBirth: dateSchema
}

type Person = Infer<typeof s>

const r = decode(s)({
  name: 'alice',
  age: 12,
  addresses: [
    { street: '123' },
    { street: '456', apartment: '9a' }
  ],
  dateOfBirth: new Date().toISOString() // will be parsed to a Date
})

console.log('decoded', inspect(r, { colors: true, depth: Infinity }))
if(isOk(r))
  console.log('encoded', inspect(encode(s)(r.value), { colors: true, depth: Infinity }))
