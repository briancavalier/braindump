import { boolean, number, string, union } from '../src'

import { runExample } from './run-example'

const t = union(string, number, boolean)

runExample(t, 1)

runExample(t, null)
