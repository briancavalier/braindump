import { arrayOf, decode, encode, formatFail, isOk, number } from '../src'

const a = arrayOf(number)

const r1 = decode(a)([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
])

if(isOk(r1)) {
  console.log('decoded', r1.value)
  const re = encode(a)(r1.value)
  console.log(isOk(re) ? re.value : formatFail(re))
} else {
  console.log(formatFail(r1))
}


const r2 = decode(a)([
  1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11
])

if (isOk(r2)) {
  console.log('decoded', r2.value)
  const re = encode(a)(r2.value)
  console.log(isOk(re) ? re.value : formatFail(re))
} else {
  console.log(formatFail(r2))
}
