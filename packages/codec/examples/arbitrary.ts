import fc from 'fast-check'

import { codec, number, ok, pipe, string, unexpected } from '../src'
import { decoded, encoded } from '../src/fast-check'

const numberToString =
  pipe(number,
    codec(
    (x: number) => ok(`${x}`),
    (x: string) => {
      const n = Number.parseFloat(x)
      return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
    },
  ))

const stringToNumber =
  pipe(string,
    codec(
      (x: string) => {
        const n = Number.parseFloat(x)
        return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
      },
      (x: number) => ok(`${x}`)
    ), number)

const s = {
  foo: number,
  bar: string,
  x: numberToString,
  y: stringToNumber
} as const

console.log('arbitrary decoded', fc.sample(decoded(s), 1))

console.log('arbitrary encoded', fc.sample(encoded(s), 1))
