import { sample } from 'fast-check'

import { float, int, number } from '../src'
import { arbitraryEncoded } from '../src/fast-check'

import { runExample } from './run-example'

const s = {
  number,
  int,
  float
}

const se = arbitraryEncoded(s)
const [e] = sample(se)

runExample(s, e)
