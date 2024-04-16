import { createInterface } from 'readline/promises'

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

const handlePrint = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {Print}, {
  handle: print => ok(console.log(print.arg)),
})

const handleRead = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {Read}, {
  initially: sync(() => createInterface({ input: process.stdin, output: process.stdout })),
  handle: (read, readline) => fx(function* () {
    const s = yield* Async.tryPromise((signal => readline.question(read.arg, { signal })))
    return [s, readline]
  }),
  finally: readline => ok(readline.close())
})

const handlePrintPure = <const E, const A>(f: Fx<E, A>) => Handler.handle(f, {Print}, {
  initially: ok([] as readonly string[]),
  handle: (print, s) => ok([undefined, [...s, print.arg]]),
  return: (_, s) => s
})

const handleReadPure = <const E, const A>(reads: readonly string[], f: Fx<E, A>) => Handler.handle(f, {Read}, {
  initially: ok(reads),
  handle: (_, [s, ...ss]) => ok([s, ss])
})

// Run with "real" Read and Print effects
const m = handleRead(handlePrint(main))

// Run with pure Read and Print effects that only collect input and output
// const m = handlePrintPure(handleReadPure(['a', 'b', 'c'], main))

Run.async(m).promise.then(console.log)
