import { Interface, createInterface } from 'readline/promises'

import { Effect, Fx, fx, resume, wait, resumeWith, handle3, pure, runAsync } from '../src'

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

const handlePrint = <const E, const A>(f: Fx<E, A>) => handle3(f, Print, {
  handle: print => pure(resume(console.log(print.arg))),
})

const handleRead = <const E, const A>(r: Interface, f: Fx<E, A>) => handle3(f, Read, {
  handle: read => fx(function* () {
    const s = yield* wait(r.question(read.arg))
    return resume(s)
  })
})

const handlePrint3 = <const E, const A>(f: Fx<E, A>) => handle3(f, Print, {
  initially: () => [] as readonly string[],
  handle: (e, s) => pure(resumeWith(undefined, [...s, e.arg])),
  return: (_, s) => s
})

const handleRead3 = <const E, const A>(reads: readonly string[], f: Fx<E, A>) => handle3(f, Read, {
  initially: () => reads,
  handle: (_, [s, ...ss]) => pure(resumeWith(s, ss))
})

// Run with "real" Read and Print effects
const r = createInterface({ input: process.stdin, output: process.stdout })
const m1 = handleRead(r, handlePrint(main))

// Run with pure Read and Print effects that only collect input and output
// const m1 = handlePrint3(handleRead3(['a', 'b', 'c'], main))

runAsync(m1).then(console.log)
