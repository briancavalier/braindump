import { codec, number, ok, pipe, string, unexpected } from '../src'
import { arbitraryDecoded, arbitraryEncoded } from '../src/arbitrary-faker'

const numberToString =
  pipe(number,
    codec(
    (x: number) => ok(`${x}`),
    (x: string) => {
      const n = Number.parseFloat(x)
      return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
    },
  ))

const s = {
  foo: number,
  bar: string,
  baz: {
    x: numberToString
  }
} as const


console.log(arbitraryDecoded(s))

console.log(arbitraryEncoded(s))
