import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { Env, Fx, Handler, Run, ok } from '../../src'

import { Print, RandomInt, Read, checkAnswer, main } from './main'

// -------------------------------------------------------------------
// #region Handlers
// *Pure* handlers for all the effects the game needs.
// This version of the game is completely pure, with no side effects.

const handlePrint = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [Print], {
  initially: ok([] as readonly string[]),
  handle: (print, s) => ok(Handler.resume(undefined, [...s, print.arg])),
  return: (_, s) => s
})

const handleRead = (responses: readonly string[]) => <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [Read], {
  initially: ok(responses),
  handle: (_, [s, ...ss]) => ok(Handler.resume(s, ss))
})

const handleRandom = (values: readonly number[]) => <const E, const A>(f: Fx<E, A>) => Handler.handle(f, [RandomInt], {
  initially: ok(values),
  handle: (e, [n, ...rest]) =>
    ok(Handler.resume(Math.max(e.arg.min, Math.min(e.arg.max, n)), [...rest, n]))
})

// #endregion
// -------------------------------------------------------------------
// #region Tests

// The "usual" tests we'd write for a pure function
describe('checkAnswer', () => {
  it('should return true if the guess is correct', () => {
    const x = Math.random()
    assert.ok(checkAnswer(x, x))
  })

  it('should return false if the guess is incorrect', () => {
    const x = Math.random()
    assert.ok(!checkAnswer(x, x + 1))
  })
})

// We can also test main
// Tests are pure, no async, no promises, no side effects.
describe('main', () => {
  it('should play the game', () => {
    const secretNumbers = [1, 2, 3, 4]
    const range = {
      min: Math.min(...secretNumbers),
      max: Math.max(...secretNumbers)
    }

    const result = main.pipe(
      handleRandom(secretNumbers),
      handleRead(['Brian', '1', 'y', '2', 'y', '3', 'y', '1', 'n']),
      handlePrint,
      Env.provide(range),
      Run.sync
    )

    assert.deepEqual(result, [
      'Hello, Brian welcome to the game!',
      'You guessed right, Brian!',
      'You guessed right, Brian!',
      'You guessed right, Brian!',
      'You guessed wrong, Brian! The number was: 4',
      'Thanks for playing, Brian.'
    ])
  })
})

// #endregion
