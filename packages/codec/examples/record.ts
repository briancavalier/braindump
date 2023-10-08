import { decode, formatFail, isOk, number, record, string } from '../src'

const a = record(string, number)

const r1 = decode(a)({
  a: 1,
  b: 2,
  d: 3,
  e: 4
})

console.log(isOk(r1) ? r1.value : formatFail(r1))

const r2 = decode(a)({
  a: 1,
  b: 2,
  x: null,
  d: 3,
  e: 4
})

console.log(isOk(r2) ? r2.value : formatFail(r2))
