import { json, lift, number, object, pipe } from '../src'

import { runExample } from './run-example'

runExample(json, JSON.stringify({ a: 1, b: 2, c: 3 }))

const s = pipe(json, object, lift({ a: number }))

runExample(s, JSON.stringify({ a: 1, b: 2, c: 3 }))

runExample(json, 'hello')
