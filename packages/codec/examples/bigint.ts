import { bigint } from '../src'

import { runExample } from './run-example'

runExample({ bigint: bigint }, { bigint: 123n })

runExample({ bigint: bigint }, { bigint: null })
