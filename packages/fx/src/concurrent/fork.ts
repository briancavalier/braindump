import { Async } from '../async'
import { Context, getContext, setContext } from '../context'
import { Effect, Fx, ok } from '../fx'
import { handle, match, resume } from '../handler'

import { Process } from './process'

export class Fork extends Effect('Fork')<Fx<unknown, unknown>, Process<unknown>> { }

export const fork = <const E, const A>(fx: Fx<E, A>) => new Fork(fx).send() as Fx<Exclude<E, Async> | Fork, Process<A>>

export const unbounded = <const E, const A>(f: Fx<E, A>) => handle(f, { Fork }, {
  handle: c => ok(resume(spawn(c.arg, [...getContext()])))
})

export const spawn = (f: Fx<unknown, unknown>, context: Context[]) => {
  const processes = new ProcessSet()

  const promise = new Promise((resolve, reject) => {
    setImmediate(async () => {
      const fc = withContext(context, f)
      setContext(context)
      const i2 = fc[Symbol.iterator]()
      let ir2 = i2.next()
      while (!ir2.done) {
        if (match(Async, ir2.value)) {
          const p = runProcess(ir2.value.arg)
          processes.add(p)
          const a = await p.promise.finally(() => processes.remove(p))
          setContext(context)
          ir2 = i2.next(a)
        }
        else if (match(Fork, ir2.value)) {
          const p = spawn(ir2.value.arg, context)
          processes.add(p)
          p.promise.finally(() => processes.remove(p))
          ir2 = i2.next(p.promise)
        }
        else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
      }
      resolve(ir2.value)
    })
  }).catch(e => (processes[Symbol.dispose](), Promise.reject(e)))

  return new Process(promise, processes)
}

const runProcess = <A>(run: (f: (a: A) => void) => Disposable) => {
  let dispose: Disposable
  return new Process<A>(
    new Promise<A>(resolve => dispose = run(resolve)),
    { [Symbol.dispose]() { dispose[Symbol.dispose]() } }
  )
}

const withContext = (c: Context[], f: Fx<unknown, unknown>) =>
  c.reduceRight((f, c) => handle(f, c.effects, c.handler as any), f)

class ProcessSet {
  private disposed = false
  private disposables = new Set<Disposable>()

  add(disposable: Disposable) {
    if (this.disposed) disposable[Symbol.dispose]()
    else this.disposables.add(disposable)
  }

  remove(disposable: Disposable) {
    this.disposables.delete(disposable)
  }

  [Symbol.dispose]() {
    if (this.disposed) return
    this.disposed = true
    for (const d of this.disposables) d[Symbol.dispose]()
  }
}
