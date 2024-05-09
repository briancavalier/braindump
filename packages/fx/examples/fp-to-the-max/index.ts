// -------------------------------------------------------------------
// Handlers for all the effects the game needs.
// The type system will prevent running the game until implementations
// of all capabilities have been provided.

import { createInterface } from 'node:readline/promises'

import { Async, Env, Fx, Resource, Run, fx, handle, ok, resume, sync } from '../../src'

import { Print, RandomInt, Read, main } from './main'

const handlePrint = handle(Print, s => ok(resume(console.log(s))))

const handleRead = <E, A>(f: Fx<E, A>) => fx(function* () {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  yield* Resource.finalize(sync(() => readline.close()))

  return yield* f.pipe(
    handle(Read, prompt => fx(function* () {
      const s = yield* Async.run((signal => readline.question(prompt, { signal })))
      return resume(s)
    }))
  )
})

const handleRandom = handle(RandomInt, ({ min, max }) => {
  const n = Math.floor(Math.random() * (max - min + 1)) + min
  return ok(resume(n))
})

const { min = 1, max = 10 } = process.env

main.pipe(
  Env.provide({ min: +min, max: +max }),
  handleRandom,
  handlePrint,
  handleRead,
  Resource.scope,
  Run.async
)
