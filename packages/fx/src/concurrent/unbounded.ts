
import { Async } from '../async'
import { Context } from '../context'
import { Fail, Failures } from '../fail'
import { Fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Fork } from './fork'
import { Process } from './process'

export const unbounded = <const E, const A>(f: Fx<E, A>) => handle(f, [Fork], {
  handle: c => ok(resume(scheduleUnbounded(withContext(c.context, c.arg), new Semaphore(Infinity))))
})

export const scheduleUnbounded = <const E, const A>(f: Fx<E, A>, s: Semaphore): Process<A, Failures<E>> => {
  const scope = new Scope()

  const promise = new Promise<A>(async (resolve, reject) => {
    const d = setImmediate(async () => {
      scope.remove(d)
      if (scope.disposed) return

      const i = f[Symbol.iterator]()
      let ir = i.next()
      while (!ir.done) {
        if (is(Async, ir.value)) {
          const p = runProcess(ir.value.arg)
          scope.add(p)
          const a = await p.promise
            .finally(() => scope.remove(p))
            .catch(reject)
          // stop if the scope was disposed while we were waiting
          if(scope.disposed) return
          ir = i.next(a)
        }
        else if (is(Fork, ir.value)) {
          await s.acquire()
          const p = scheduleUnbounded(withContext(ir.value.context, ir.value.arg), s)
          scope.add(p)
          p.promise
            .finally(() => {
              scope.remove(p)
              s.release()
            })
            .catch(reject)
          ir = i.next(p)
        }
        else if (is(Fail, ir.value)) return reject(ir.value.arg)
        else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir.value)}`))
      }
      resolve(ir.value as A)
    })

    scope.add(d)
  }).finally(() => scope[Symbol.dispose]())

  return new Process(promise, scope)
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
  private _disposed = false;
  private readonly disposables = new Set<Disposable>();

  add(disposable: Disposable) {
    if (this._disposed) disposable[Symbol.dispose]()
    else this.disposables.add(disposable)
  }

  remove(disposable: Disposable) {
    this.disposables.delete(disposable)
  }

  get disposed() { return this._disposed }

  [Symbol.dispose]() {
    if (this._disposed) return
    this._disposed = true
    for (const d of this.disposables) d[Symbol.dispose]()
  }
}

class AbortControllerDisposable {
  constructor(private readonly controller: AbortController) { }
  [Symbol.dispose]() { this.controller.abort() }
}

export class Semaphore {
  private waiters: (() => void)[] = []
  constructor(private available: number) {}

  acquire() {
    if(this.available > 0) {
      this.available--
      return Promise.resolve()
    }
    return new Promise<void>(resolve => this.waiters.push(resolve))
  }

  release() {
    if(this.waiters.length) this.waiters.shift()!()
    else this.available++
  }
}
