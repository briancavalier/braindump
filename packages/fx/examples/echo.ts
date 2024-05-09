
import { createInterface } from 'node:readline/promises'

import { Async, Effect, Fx, Resource, Run, fx, handle, ok, resume, sync } from '../src'

class Print extends Effect<'Print', string, void> { }

const print = (s: string) => new Print(s)

class Read extends Effect<'Read', string, string> { }

const read = (prompt: string) => new Read(prompt)

const main = fx(function* () {
  while(true) {
    const x = yield* read('echo> ')
    if(!x) return
    yield* print(x)
  }
})

const handlePrint = handle(Print, s => ok(resume(console.log(s))))

const handleRead = <E, A>(f: Fx<E, A>) => fx(function* () {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  yield* Resource.finalize(sync(() => readline.close()))

  return yield* f.pipe(
    handle(Read, prompt => fx(function* () {
      const s = yield* Async.run(signal => readline.question(prompt, { signal }))
      return resume(s)
    })))
})

// Run with "real" Read and Print effects
main.pipe(handleRead, handlePrint, Resource.scope, Run.async)
  .promise.then(console.log)

// const handlePrintPure = <E, A>(f: Fx<E, A>) => fx(function* () {
//   const printed = [] as string[]
//   return yield* f.pipe(
//     handle(Print, s => ok(resume(void printed.push(s)))),
//     map(() => printed)
//   )
// })

// const handleReadPure = ([...inputs]: readonly string[]) =>
//   handle(Read, () => ok(resume(inputs.shift()!)))

// // Run with pure Read and Print effects that only collect input and output
// main.pipe(handlePrintPure, handleReadPure(['a', 'b', 'c']), Run.async)
//   .promise.then(console.log)
