import { number, record, string } from '../src'

import { runExample } from './run-example'

const a = record(string, number)

runExample(a, {
  a: 1,
  b: 2,
  d: 3,
  e: 4
})

runExample(a, {
  a: 1,
  b: 2,
  x: null,
  d: 3,
  e: 4
})
