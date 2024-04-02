import { Decoded, codec, encode, isOk, ok, unexpected } from '../src'

const is = <S>(s: S) => (x: unknown): x is Decoded<S> =>
  isOk(encode(s)(x as any))

const stringToNumber =
  codec(
    (x: string) => {
      const n = Number.parseFloat(x)
      return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
    },
    (x: number) => ok(`${x}`)
  )

const s = {
  a: stringToNumber,
}

const isS = is(s)
if(isS({ a: "1" }))
  console.log(true)
else
  console.log(false)
