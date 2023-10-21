import { number, rest, string } from '../src'

import { runExample } from './run-example'

const t = [string, rest(number)] as const

runExample(t, [1, 2, null, 4])

runExample(t, ['1', 2, 3, 4])
