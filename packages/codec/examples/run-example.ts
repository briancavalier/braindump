import { Schema, decode, isOk, encode, formatFail } from '../src'

export const runExample = <const S extends Schema>(s: S, x: any) => {
  const r1 = decode(s)(x as any)

  if (isOk(r1)) {
    console.log('decoded', r1.value as any)
    const re = encode(s)(r1.value)
    isOk(re) ? console.log('encoded', re.value) : console.log(formatFail(re))
  } else {
    console.log(formatFail(r1))
  }
}
