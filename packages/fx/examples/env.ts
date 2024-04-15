import { fx, run } from '../src'
import { get, provideAll, provide } from '../src/env'

// --------------------------------------------------

// Can request separately
const main1 = fx(function* () {
  const { x } = yield* get<{ x: number }>()
  const { y } = yield* get<{ y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
provideAll({}, provide({ x: 1 }, main1))

// @ts-expect-error wrong type for y
provideAll({}, provide({ x: 1, y: 123 }, main1))

run(
  provide({ y: 'hello' }, provide({ x: 1 }, main1))
).promise.then(r => console.log('main1', r))

// --------------------------------------------------

// Or all at once
const main2 = fx(function* () {
  const { x, y } = yield* get<{ x: number, y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
provideAll({}, provide({ x: 1 }, main2))

run(
  provide({ y: 'hello' }, provide({ x: 1 }, main2))
).promise.then(r => console.log('main2', r))

// --------------------------------------------------

// isolateEnv enforces all remaining requirements
// must be meet
const main3 = fx(function* () {
  const { x, y } = yield* get<{ x: number, y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
provideAll({ x: 1 }, main3)

run(
  // Not supplying the complete remaining
  // environment here will be a type error
  provideAll({ x: 1, y: 'hello' }, main3)
).promise.then(r => console.log('main3', r))
