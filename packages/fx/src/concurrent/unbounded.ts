
import { Async } from '../async'
import { Context } from '../context'
import { Fail, Failures } from '../fail'
import { Fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Fork } from './fork'
import { Process } from './process'

export const unbounded = <const E, const A>(f: Fx<E, A>) => handle(f, [Fork], {
  handle: c => ok(resume(scheduleUnbounded(withContext(c.context, c.arg))))
})

export const scheduleUnbounded = <const E, const A>(f: Fx<E, A>): Process<A, Failures<E>> => {
  const scope = new Scope()

  const promise = new Promise<A>((resolve, reject) => {
    const d = setImmediate(() => {
      scope.remove(d)
      sp(scope, resolve, reject, f)
    })
    scope.add(d)
  }).finally(() => scope[Symbol.dispose]())

  return new Process(promise, scope)
}

const sp = async <const E, const A>(
  scope: Scope,
  resolve: (a: A) => void,
  reject: (e: unknown) => void,
  f: Fx<E, A>
) => {
  const i = f[Symbol.iterator]()
  let ir = i.next()
  while (!ir.done) {
    if (is(Async, ir.value)) {
      const p = runProcess(ir.value.arg)
      scope.add(p)
      const a = await p.promise
        .catch(reject)
        .finally(() => scope.remove(p))
      ir = i.next(a)
    }
    else if (is(Fork, ir.value)) {
      const p = scheduleUnbounded(withContext(ir.value.context, ir.value.arg))
      scope.add(p)
      p.promise
        .catch(reject)
        .finally(() => scope.remove(p))
      ir = i.next(p)
    }
    else if (is(Fail, ir.value)) return reject(ir.value.arg)
    else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir.value)}`))
  }
  resolve(ir.value as A)
}

const runProcess = <A>(run: (s: AbortSignal) => Promise<A>) => {
  const s = new AbortController()
  return new Process<A, unknown>(run(s.signal), new AbortControllerDisposable(s))
}

const withContext = (c: readonly Context[], f: Fx<unknown, unknown>) =>
  c.reduce((f, c) => handle(
    f,
    c.effects,
    c.handler.initially
      ? { ...c.handler, initially: ok(c.state) }
      : c.handler as any
  ), f)

class Scope {
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
