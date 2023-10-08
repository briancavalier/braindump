import { arrayOf, decode, formatFail, isOk, number } from '../src'

const a = arrayOf(number)

const r1 = decode(a)([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
])

console.log(isOk(r1) ? r1.value : formatFail(r1))

const r2 = decode(a)([
  1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11
])

console.log(isOk(r2) ? r2.value : formatFail(r2))
