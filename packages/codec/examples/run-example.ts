import { decode, isOk, encode, formatFail, Encoded, formatValue } from '../src'

export const runExample = <const S>(s: S, x: Encoded<S>) => {
  const r1 = decode(s)(x as Encoded<S>)

  if (isOk(r1)) {
    console.log('decoded', formatValue(r1.value))
    const re = encode(s)(r1.value)
    isOk(re) ? console.log('encoded', formatValue(re.value)) : console.log(formatFail(re))
  } else {
    console.log(formatFail(r1))
  }
}
