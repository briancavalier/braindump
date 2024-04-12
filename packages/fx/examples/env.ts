import { fx } from '../src'
import { env, isolateEnv, withEnv } from '../src/env'
import { run } from '../src/runtime/default'

// --------------------------------------------------

// Can request separately
const main1 = fx(function* () {
  const { x } = yield* env<{ x: number }>()
  const { y } = yield* env<{ y: string }>()
  console.log(x, y)
})

run(
  withEnv({ y: 'hello' }, withEnv({ x: 1 }, main1))
).then(console.log)

// --------------------------------------------------

// Or all at once
const main2 = fx(function* () {
  const { x, y } = yield* env<{ x: number, y: string }>()
  console.log(x, y)
})

run(
  withEnv({ y: 'hello' }, withEnv({ x: 1 }, main2))
).then(console.log)

// --------------------------------------------------

// isolateEnv enforces all remaining requirements
// must be meet
const main3 = fx(function* () {
  const { x, y } = yield* env<{ x: number, y: string }>()
  console.log(x, y)
})

run(
  // Not supplying the complete remaining
  // environment here will be a type error
  isolateEnv({ x: 1, y: 'hello' }, main3)
).then(console.log)
