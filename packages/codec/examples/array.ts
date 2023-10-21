import { arrayOf, number } from '../src'

import { runExample } from './run-example'

const a = arrayOf(number)

runExample(a, [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ])

runExample(a, [ 1, 2, 3, 4, 5, null, 6, 7, 8, 9, 10, 11 ])
