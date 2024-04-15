import { Async } from '../async'
import { getContext, Context, setContext } from '../context'
import { Effect, Fx, of, isEffect } from '../fx'
import { handle } from '../handle'

import { Process } from './process'

export class Concurrent extends Effect('Concurrent')<Fx<unknown, unknown>> { }

export const fork = <const E, const A>(fx: Fx<E, A>) => new Concurrent(fx) as Fx<Exclude<E, Async> | Concurrent, Process<A>>

export const withUnboundedConcurrency = <const E, const A>(f: Fx<E, A>) => handle(f, { Concurrent }, {
  handle: c => of(spawn(c.arg, [...getContext()]))
})

export const spawn = (f: Fx<unknown, unknown>, context: Context[]) => {
  const processes = new Set<Process<unknown>>()
  let disposed = false

  const addProcess = (p: Process<unknown>) => {
    if (disposed) p.dispose[Symbol.dispose]()
    else processes.add(p)
  }

  const removeProcess = (p: Process<unknown>) =>
    processes.delete(p)

  const disposeAll = () => {
    if (disposed) return
    disposed = true
    processes.forEach(p => p.dispose[Symbol.dispose]())
  }

  const promise = new Promise((resolve, reject) => {
    setImmediate(async () => {
      const fc = withContext(context, f)
      setContext(context)
      const i2 = fc[Symbol.iterator]()
      let ir2 = i2.next()
      while (!ir2.done) {
        if (isEffect(Async, ir2.value)) {
          const p = runProcess(ir2.value.arg)
          addProcess(p)
          const a = await p.promise.finally(() => removeProcess(p))
          setContext(context)
          ir2 = i2.next(a)
        }
        else if (isEffect(Concurrent, ir2.value)) {
          const p = spawn(ir2.value.arg, context)
          addProcess(p)
          p.promise.finally(() => removeProcess(p))
          ir2 = i2.next(p.promise)
        }
        else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
      }
      resolve(ir2.value)
    })
  }).catch(e => (disposeAll(), Promise.reject(e)))

  return new Process(promise, { [Symbol.dispose]: disposeAll })
}

const runProcess = <A>(run: (f: (a: A) => void) => Disposable) => {
  let dispose: Disposable
  return new Process<A>(new Promise<A>(resolve => dispose = run(resolve)), { [Symbol.dispose]() { dispose[Symbol.dispose]() } })
}

const withContext = (c: Context[], f: Fx<unknown, unknown>) =>
  c.reduceRight((f, c) => handle(f, c.effects, c.handler as any), f)
