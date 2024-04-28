// -------------------------------------------------------------------
// Handlers for all the effects the game needs.
// The type system will prevent running the game until implementations
// of all capabilities have been provided.

import { createInterface } from 'readline/promises'

import { Async, Env, Fx, Handler, Run, fx, ok, sync } from '../../src'

import { Print, RandomInt, Read, main } from './main'

const handlePrint = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {
  effects: [Print],
  handle: print => ok(Handler.resume(console.log(print.arg)))
})

const handleRead = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {
  effects: [Read],
  initially: sync(() => createInterface({ input: process.stdin, output: process.stdout })),
  handle: (read, readline) => fx(function* () {
    const s = yield* Async.run((signal => readline.question(read.arg, { signal })))
    return Handler.resume(s, readline)
  }),
  finally: readline => ok(readline.close())
})

const handleRandom = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {
  effects: [RandomInt],
  handle: random => {
    const n = Math.floor(Math.random() * (random.arg.max - random.arg.min + 1)) + random.arg.min
    return ok(Handler.resume(n))
  }
})

const { min = 1, max = 10 } = process.env

main.pipe(
  Env.provide({ min: +min, max: +max }),
  handleRandom,
  handlePrint,
  handleRead,
  Run.async
)
