import { sample } from 'fast-check'

import { boolean, number, string, tstring, union } from '../src'
import { arbitraryDecoded } from '../src/fast-check'

import { runExample } from './run-example'

const s = tstring('hello, ', string, '! The magic number is ', union(boolean, number))

// type D = Decoded<typeof s>
// type E = Encoded<typeof s>

runExample(s, 'hello, world! The magic number is foobar')
runExample(s, 'hello, world! The magic number is ' + 1.23e7)

const a = arbitraryDecoded(s)
console.log(sample(a, 1))
