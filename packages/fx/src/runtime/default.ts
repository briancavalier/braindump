import { Async, Concurrent, fork } from '../async'
import { Context, getContext, setContext } from '../context'
import { provideAll } from '../env'
import { Fx, of, isEffect } from '../fx'
import { handle } from '../handle'

export const run = <const R>(f: Fx<Async | Concurrent, R>): Promise<R> =>
  getResult(handleConcurrent(fork(provideAll({}, f))))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value

export const handleConcurrent = <const E, const A>(f: Fx<E, A>) => handle(f, {Concurrent}, {
  handle: c => of(spawnAsync(c.arg as Fx<any, unknown>, [...getContext()])),
  return: a => Promise.resolve(a)
})

export const spawnAsync = (f: Fx<unknown, unknown>, context: Context[]) => new Promise((resolve, reject) => {
  setImmediate(async () => {
    const fc = withContext(context, f)
    setContext(context)
    const i2 = fc[Symbol.iterator]()
    let ir2 = i2.next()
    while (!ir2.done) {
      if (isEffect(Async, ir2.value)) {
        const a = await new Promise(ir2.value.arg)
        setContext(context)
        ir2 = i2.next(a)
      }
      else if (isEffect(Concurrent, ir2.value)) ir2 = i2.next(spawnAsync(ir2.value.arg as any, [...context]))
      else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
    }
    resolve(ir2.value)
  })
})

export const withContext = (c: Context[], f: Fx<unknown, unknown>) =>
  c.reduceRight((f, c) => handle(f, c.effects, c.handler as any), f)
