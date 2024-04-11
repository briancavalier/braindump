import { Async, Concurrent, fork } from '../async'
import { Fx, pure, isEffect } from '../fx'
import { handle, resume } from '../handle'

export const run = <const R>(f: Fx<Async | Concurrent, R>): Promise<R> => getResult(handleConcurrent(fork(f)))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value

export const handleConcurrent = <const E, const A>(f: Fx<E, A>) => handle(f, Concurrent, {
  handle: c => pure(resume(spawnAsync(c as Fx<any, unknown>))),
  return: a => Promise.resolve(a)
})

export const spawnAsync = <F extends Fx<Async | Concurrent, unknown>>(f: F) => new Promise((resolve, reject) =>
  setImmediate(async () => {
    const i2 = f[Symbol.iterator]()
    let ir2 = i2.next()
    while (!ir2.done) {
      if (isEffect(Async, ir2.value)) ir2 = i2.next(await new Promise(ir2.value.arg))
      else if (isEffect(Concurrent, ir2.value)) ir2 = i2.next(spawnAsync(ir2.value.arg as any))
      else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
    }
    resolve(ir2.value)
  }))
