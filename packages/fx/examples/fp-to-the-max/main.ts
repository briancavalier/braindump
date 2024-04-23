

import { Effect, Env, fx } from '../../src'

// -------------------------------------------------------------------
// The number guessing game example from
// https://www.youtube.com/watch?v=sxudIMiOo68

// -------------------------------------------------------------------
// #region New effects the game will need

export class Print extends Effect('Print')<string, void> { }

const print = (s: string) => new Print(s).send()

export class Read extends Effect('Read')<string, string> { }

const read = (prompt: string) => new Read(prompt).send()

export type Range = {
  readonly min: number,
  readonly max: number
}

export class RandomInt extends Effect('RandomInt')<Range, number> { }

const nextInt = (range: Range) => new RandomInt(range).send()

// #endregion

// -------------------------------------------------------------------
// The game

// Core "business logic": evaluate the user's guess
export const checkAnswer = (secret: number, guess: number): boolean =>
  secret === guess

// Main game loop. Play round after round until the user chooses to quit
export const main = fx(function* () {
  const name = yield* read('What is your name? ')
  yield* print(`Hello, ${name} welcome to the game!`)

  const range = yield* Env.get<Range>()

  do
    yield* play(name, range)
  while (yield* checkContinue(name))

  yield* print(`Thanks for playing, ${name}.`)
})

// Play one round of the game.  Generate a number and ask the user
// to guess it.
export const play = (name: string, range: Range) => fx(function* () {
  // It doesn't actually matter whether we generate the number before
  // or after the user guesses, but we'll do it here
  const secret = yield* nextInt(range)

  const result = yield* read(`Dear ${name}, please guess a number from ${range.min} to ${range.max}: `)

  const guess = Number.parseInt(result, 10)
  if (!Number.isInteger(guess))
    yield* print('You did not enter an integer!')
  else if (checkAnswer(secret, guess))
    yield* print(`You guessed right, ${name}!`)
  else
    yield* print(`You guessed wrong, ${name}! The number was: ${secret}`)
})

// Ask the user if they want to play again.
// Note that we keep asking until the user gives an answer we recognize
export const checkContinue = (name: string) => fx(function* () {
  for (;;) {
    const answer = yield* read(`Do you want to continue, ${name}? (y/n) `)
    switch (answer.trim().toLowerCase()) {
      case 'y': return true
      case 'n': return false
      default: yield* print('Please enter y or n.')
    }
  }
})
