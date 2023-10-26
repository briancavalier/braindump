import { codec, unexpected, ok } from '../src'

import { runExample } from './run-example'

const stringToNumber =
  codec(
    (x: string) => {
      const n = Number.parseFloat(x)
      return Number.isNaN(n) ? unexpected('numeric string', x) : ok(n)
    },
    (x: number) => ok(`${x}`)
  )

runExample(stringToNumber, '123')
runExample(stringToNumber, 'hello')
