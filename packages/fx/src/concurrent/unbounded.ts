
import { Async } from '../async'
import { Context } from '../context'
import { Fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Fork } from './fork'
import { Process } from './process'

export const unbounded = <const E, const A>(f: Fx<E, A>) => handle(f, { Fork }, {
  handle: c => ok(resume(spawn(withContext(c.context, c.arg))))
})

export const spawn = <const E, const A>(f: Fx<E, A>): Process<A> => {
  const processes = new ProcessSet()

  const promise = new Promise<A>(async (resolve, reject) => {
    const i2 = f[Symbol.iterator]()
    let ir2 = i2.next()
    while (!ir2.done) {
      if (is(Async, ir2.value)) {
        const p = runProcess(ir2.value.arg)
        processes.add(p)
        const a = await p.promise.finally(() => processes.remove(p))
        ir2 = i2.next(a)
      }
      else if (is(Fork, ir2.value)) {
        const p = spawn(withContext(ir2.value.context, ir2.value.arg))
        processes.add(p)
        p.promise.finally(() => processes.remove(p))
        ir2 = i2.next(p)
      }
      else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
    }
    resolve(ir2.value as A)
  }).catch(e => (processes[Symbol.dispose](), Promise.reject(e)))

  return new Process(promise, processes)
}

const runProcess = <A>(run: (s: AbortSignal) => Promise<A>) => {
  const s = new AbortController()
  return new Process<A>(run(s.signal), { [Symbol.dispose]() { s.abort() } })
}

export const withContext = (c: readonly Context[], f: Fx<unknown, unknown>) =>
  c.reduce((f, c) => handle(
    f,
    c.effects,
    c.handler.initially
      ? { ...c.handler, initially: ok(c.state) }
      : c.handler as any
  ), f)

class ProcessSet {
  private disposed = false;
  private disposables = new Set<Disposable>();

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
