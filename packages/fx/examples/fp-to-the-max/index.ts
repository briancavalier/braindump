// -------------------------------------------------------------------
// Handlers for all the effects the game needs.
// The type system will prevent running the game until implementations
// of all capabilities have been provided.

import { createInterface } from 'readline/promises'

import { Async, Env, Fx, Handler, Run, fx, ok, sync } from '../../src'

import { Print, RandomInt, Read, main } from './main'

const handlePrint = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [Print], {
  handle: print => ok(Handler.resume(console.log(print.arg)))
})

const handleRead = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [Read], {
  initially: sync(() => createInterface({ input: process.stdin, output: process.stdout })),
  handle: (read, readline) => fx(function* () {
    const s = yield* Async.run((signal => readline.question(read.arg, { signal })))
    return Handler.resume(s, readline)
  }),
  finally: readline => ok(readline.close())
})

const handleRandom = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [RandomInt], {
  handle: random => {
    const n = Math.floor(Math.random() * (random.arg.max - random.arg.min + 1)) + random.arg.min
    return ok(Handler.resume(n))
  }
})

const { MIN = 1, MAX = 10 } = process.env

Run.async(
  Env.provideAll({ min: +MIN, max: +MAX },
    handlePrint(
      handleRead(
        handleRandom(main)
    ))))
