// -------------------------------------------------------------------
// *Pure* handlers for all the effects the game needs.
// This version of the game is completely pure, with no side effects.

import { Env, Fx, Handler, Run, ok } from '../../src'

import { Print, RandomInt, Read, main } from './main'

const handlePrintPure = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, { Print }, {
  initially: ok([] as readonly string[]),
  handle: (print, s) => ok(Handler.resume(undefined, [...s, print.arg])),
  return: (_, s) => s
})

const handleReadPure = <const E, const A>(responses: readonly string[], f: Fx<E, A>) => Handler.handle(f, { Read }, {
  initially: ok(responses),
  handle: (_, [s, ...ss]) => ok(Handler.resume(s, ss))
})

const handleRandomPure = <const E, const A>(values: readonly number[], f: Fx<E, A>) => Handler.handle(f, { RandomInt }, {
  initially: ok(values),
  handle: (e, [n, ...rest]) =>
    ok(Handler.resume(Math.max(e.arg.min, Math.min(e.arg.max, n)), [...rest, n]))
})

const range = { min: 1, max: 10 }
const numbers = Array.from({ length: range.max - range.min + 1 }, (_, i) => i + range.min)

const result = Run.sync(
  Env.provideAll(range,
    handlePrintPure(
      handleReadPure(['Brian', '1', 'y', '2', 'y', '3', 'y', '1', 'n'],
        handleRandomPure(numbers, main)
      ))))

console.log(result)
