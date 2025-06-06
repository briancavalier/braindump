import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { Env, Fx, Run, fx, handle, map, ok } from '../../src'

import { Print, RandomInt, Read, checkAnswer, main } from './main'

// -------------------------------------------------------------------
// #region Handlers
// *Pure* handlers for all the effects the game needs.
// This version of the game is completely pure, with no side effects.

const handlePrint = <E, A>(f: Fx<E, A>) => fx(function* () {
  const printed = [] as string[]
  return yield* f.pipe(
    handle(Print, s => ok(void printed.push(s))),
    map(_ => printed)
  )
})

const handleRead = ([...inputs]: readonly string[]) =>
  handle(Read, _ => ok(inputs.shift()!))

const handleRandom = ([...values]: readonly number[]) =>
  handle(RandomInt, ({ min, max }) => ok(Math.max(min, Math.min(max, values.shift()!))))

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
      'Hello, Brian. Welcome to the game!',
      'You guessed right, Brian!',
      'You guessed right, Brian!',
      'You guessed right, Brian!',
      'You guessed wrong, Brian! The number was: 4',
      'Thanks for playing, Brian.'
    ])
  })
})

// #endregion
