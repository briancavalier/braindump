

import { createInterface } from 'node:readline/promises'

import { Async, Effect, Fx, Handler, Run, fx, ok, sync } from '../src'

class Print extends Effect('Print')<string, void> { }

const print = (s: string) => new Print(s).send()

class Read extends Effect('Read')<string, string> { }

const read = (prompt: string) => new Read(prompt).send()

const main = fx(function* () {
  while(true) {
    const x = yield* read('echo> ')
    if(!x) return
    yield* print(x)
  }
})

const handlePrint = <const E, const A>(f: Fx<E, A>) => Handler.handle(f)
  .on(Print, s => ok(Handler.resume(console.log(s))))
  .return()

const handleRead = <const E, const A>(f: Fx<E, A>) => Handler.handle(f)
  .initially(sync(() => createInterface({ input: process.stdin, output: process.stdout })))
  .on(Read, (prompt, readline) => fx(function* () {
    const s = yield* Async.run((signal => readline.question(prompt, { signal })))
    return Handler.resume(s, readline)
  }))
  .finally(readline => ok(readline.close()))
  .return()

// Run with "real" Read and Print effects
main.pipe(handleRead, handlePrint, Run.async)
  .promise.then(console.log)

// const handlePrintPure = <E, A>(f: Fx<E, A>) => Handler.handle2(f)
//   .initially(ok([] as readonly string[]))
//   .on(Print, (s, ss) => ok(Handler.resume(undefined, [...ss, s])))
//   .return((_, s) => s)


// const handleReadPure = (reads: readonly string[]) => <E, A>(f: Fx<E, A>) => Handler.handle2(f)
//   .initially(ok(reads))
//   .on(Read, (_, [s, ...ss]) => ok(Handler.resume(s, ss)))

// // Run with pure Read and Print effects that only collect input and output
// main.pipe(handlePrintPure, handleReadPure(['a', 'b', 'c']), Run.async)
//   .promise.then(console.log)
