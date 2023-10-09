import { boolean, decode, encode, formatFail, isOk, number, string } from '../src'

const t = [string, number, boolean] as const

const r1 = decode(t)(['', 1])

if (isOk(r1)) {
  console.log('decoded', r1.value)
  const re = encode(t)(r1.value)
  console.log(isOk(re) ? re.value : formatFail(re))
} else {
  console.log(formatFail(r1))
}
const r2 = decode(t)(['1', 2, true, 3])

if (isOk(r2)) {
  console.log('decoded', r2.value)
  const re = encode(t)(r2.value)
  console.log(isOk(re) ? re.value : formatFail(re))
} else {
  console.log(formatFail(r2))
}
