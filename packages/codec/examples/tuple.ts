import { assertOk, boolean, decode, number, string, union } from '../src'

import { runExample } from './run-example'

const t = [string, number, boolean] as const

runExample(t, ['', 1])

runExample(t, ['1', 2, true])

runExample(t, ['1', 2, true, 3])


const s1 = [number] as const
const s2 = [number, number] as const
const s3 = [number, number, number] as const
const s4 = [number, number, number, number] as const

// const s = union(s4, s3, s2, s1)
const s = union(s1, s2, s3, s4)

// console.log(assertOk(decode(s)([1, 2, 3, 4, 5])))
console.log(assertOk(decode(s)([1, 2, 3, 4])))
console.log(assertOk(decode(s)([])))
