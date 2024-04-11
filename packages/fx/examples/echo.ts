import { createInterface } from 'readline/promises'

import { Effect, Fx, fx, resume, wait, resumeWith, handle, of, run, sync } from '../src'

class Print extends Effect('Print')<string> { }

const print = (s: string) => new Print(s).request<void>()

class Read extends Effect('Read')<string> { }

const read = (prompt: string) => new Read(prompt).request<string>()

const main = fx(function* () {
  while(true) {
    const x = yield* read('echo> ')
    if(!x) return
    yield* print(x)
  }
})

const handlePrint = <const E, const A>(f: Fx<E, A>) => handle(f, Print, {
  handle: msg => of(resume(console.log(msg))),
})

const handleRead = <const E, const A>(f: Fx<E, A>) => handle(f, Read, {
  initially: sync(() => createInterface({ input: process.stdin, output: process.stdout })),
  handle: (prompt, readline) => fx(function* () {
    const s = yield* wait(readline.question(prompt))
    return resumeWith(s, readline)
  }),
  finally: readline => of(readline.close())
})

const handlePrintPure = <const E, const A>(f: Fx<E, A>) => handle(f, Print, {
  initially: of([] as readonly string[]),
  handle: (msg, s) => of(resumeWith(undefined, [...s, msg])),
  return: (_, s) => s
})

const handleReadPure = <const E, const A>(reads: readonly string[], f: Fx<E, A>) => handle(f, Read, {
  initially: of(reads),
  handle: (_, [s, ...ss]) => of(resumeWith(s, ss))
})

// Run with "real" Read and Print effects
const m = handleRead(handlePrint(main))

// Run with pure Read and Print effects that only collect input and output
// const m = handlePrintPure(handleReadPure(['a', 'b', 'c'], main))

run(m).then(console.log)
