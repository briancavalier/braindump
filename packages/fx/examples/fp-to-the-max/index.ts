// -------------------------------------------------------------------
// Handlers for all the effects the game needs.
// The type system will prevent running the game until implementations
// of all capabilities have been provided.

import { createInterface } from 'readline/promises'

import { Async, Env, Fx, Handler, Run, fx, ok, sync } from '../../src'

import { Print, RandomInt, Read, main } from './main'

const handlePrint = <E, A>(f: Fx<E, A>) => Handler
  .on(Print, s => ok(Handler.resume(console.log(s))))
  .handle(f)

const handleRead = <E, A>(f: Fx<E, A>) => Handler
  .initially(
    sync(() => createInterface({ input: process.stdin, output: process.stdout }))
  )
  .finally(
    readline => ok(readline.close())
  )
  .on(Read, (prompt, readline) => fx(function* () {
    const s = yield* Async.run((signal => readline.question(prompt, { signal })))
    return Handler.resume(s, readline)
  }))
  .handle(f)

const handleRandom = <E, A>(f: Fx<E, A>) => Handler
  .on(RandomInt, ({ min, max }) => {
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    return ok(Handler.resume(n))
  })
  .handle(f)

const { min = 1, max = 10 } = process.env

main.pipe(
  Env.provide({ min: +min, max: +max }),
  handleRandom,
  handlePrint,
  handleRead,
  Run.async
)
