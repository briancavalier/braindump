import { boolean, number, string } from '../src'

import { runExample } from './run-example'

const t = [string, number, boolean] as const

runExample(t, ['', 1])

runExample(t, ['1', 2, true])

runExample(t, ['1', 2, true, 3])
