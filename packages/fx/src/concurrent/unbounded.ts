
import { Async } from '../async'
import { Context } from '../context'
import { Fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Fork } from './fork'
import { Process } from './process'

export const unbounded = <const E, const A>(f: Fx<E, A>) => handle(f, [Fork], {
  handle: c => ok(resume(spawn(withContext(c.context, c.arg))))
})

export const spawn = <const E, const A>(f: Fx<E, A>): Process<A> => {
  const processes = new ProcessSet()

  const promise = new Promise<A>(async (resolve, reject) => {
    const i = f[Symbol.iterator]()
    let ir = i.next()
    while (!ir.done) {
      if (is(Async, ir.value)) {
        const p = runProcess(ir.value.arg)
        processes.add(p)
        const a = await p.promise.finally(() => processes.remove(p))
        ir = i.next(a)
      }
      else if (is(Fork, ir.value)) {
        const p = spawn(withContext(ir.value.context, ir.value.arg))
        processes.add(p)
        p.promise.finally(() => processes.remove(p))
        ir = i.next(p)
      }
      else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir.value)}`))
    }
    resolve(ir.value as A)
  }).catch(e => (processes[Symbol.dispose](), Promise.reject(e)))

  return new Process(promise, processes)
}

const runProcess = <A>(run: (s: AbortSignal) => Promise<A>) => {
  const s = new AbortController()
  return new Process<A>(run(s.signal), new AbortControllerDisposable(s))
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

class AbortControllerDisposable {
  constructor(private readonly controller: AbortController) { }
  [Symbol.dispose]() { this.controller.abort() }
}
