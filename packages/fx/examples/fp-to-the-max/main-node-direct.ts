


import { stdout } from 'process'
import { createInterface } from 'readline/promises'


// -------------------------------------------------------------------
// The number guessing game example from
// https://www.youtube.com/watch?v=sxudIMiOo68

// -------------------------------------------------------------------
// #region New effects the game will need

const print = (s: string) =>
  stdout.write(`${s}\n`)

const readline = createInterface({ input: process.stdin, output: process.stdout })
const read = (prompt: string) =>
  readline.question(prompt)

export type Range = {
  readonly min: number,
  readonly max: number
}

const nextInt = (range: Range) =>
  Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

// #endregion

// -------------------------------------------------------------------
// The game

// Core "business logic": evaluate the user's guess
export const checkAnswer = (secret: number, guess: number): boolean =>
  secret === guess

// Main game loop. Play round after round until the user chooses to quit
export const main = async (range: Range) => {
  const name = await read('What is your name? ')
  print(`Hello, ${name} welcome to the game!`)

  do
    await play(name, range)
  while (await checkContinue(name))

  print(`Thanks for playing, ${name}.`)
}

// Play one round of the game.  Generate a number and ask the user
// to guess it.
const play = async (name: string, range: Range) => {
  // It doesn't actually matter whether we generate the number before
  // or after the user guesses, but we'll do it here
  const secret = nextInt(range)

  const result = await read(`Dear ${name}, please guess a number from ${range.min} to ${range.max}: `)

  const guess = Number.parseInt(result, 10)
  if (!Number.isInteger(guess))
    print('You did not enter an integer!')
  else if (checkAnswer(secret, guess))
    print(`You guessed right, ${name}!`)
  else
    print(`You guessed wrong, ${name}! The number was: ${secret}`)
}

// Ask the user if they want to play again.
// Note that we keep asking until the user gives an answer we recognize
const checkContinue = async (name: string) => {
  for(;;) {
    const answer = await read(`Do you want to continue, ${name}? (y/n) `)
    switch (answer.trim().toLowerCase()) {
      case 'y': return true
      case 'n': return false
      default: print('Please enter y or n.')
    }
  }
}

const { min = 1, max = 10 } = process.env

main({ min: +min, max: +max })
