import { Env, Run, fx } from '../src'

// --------------------------------------------------

// Can request separately
const main1 = fx(function* () {
  const { x } = yield* Env.get<{ x: number }>()
  const { y } = yield* Env.get<{ y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
Env.provideAll({}, Env.provide({ x: 1 }, main1))

// @ts-expect-error wrong type for y
Env.provideAll({}, Env.provide({ x: 1, y: 123 }, main1))

Run.async(
  Env.provide({ y: 'hello' }, Env.provide({ x: 1 }, main1))
).promise.then(r => console.log('main1', r))

// --------------------------------------------------

// Or all at once
const main2 = fx(function* () {
  const { x, y } = yield* Env.get<{ x: number, y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
Env.provideAll({}, Env.provide({ x: 1 }, main2))

Run.async(
  Env.provide({ y: 'hello' }, Env.provide({ x: 1 }, main2))
).promise.then(r => console.log('main2', r))

// --------------------------------------------------

// isolateEnv enforces all remaining requirements
// must be meet
const main3 = fx(function* () {
  const { x, y } = yield* Env.get<{ x: number, y: string }>()
  console.log(x, y)
})

// @ts-expect-error missing y
Env.provideAll({ x: 1 }, main3)

Run.async(
  // Not supplying the complete remaining
  // environment here will be a type error
  Env.provideAll({ x: 1, y: 'hello' }, main3)
).promise.then(r => console.log('main3', r))
