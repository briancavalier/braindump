
import { Async } from '../async'
import { Context } from '../context'
import { Fail, Failures } from '../fail'
import { Fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Fork } from './fork'
import { Process } from './process'
import { Scope } from './scope'
import { Semaphore, acquire } from './semaphore'

export const unbounded = <const E, const A>(f: Fx<E, A>) =>
  bounded(f, Infinity)

export const bounded = <const E, const A>(f: Fx<E, A>, maxConcurrency: number) =>
  handle(f, [Fork], {
    initially: ok(new Semaphore(maxConcurrency)),
    handle: (f, s) => ok(resume(schedule(withContext(f.context, f.arg), s), s))
  })

export const schedule = <const E, const A>(f: Fx<E, A>, s: Semaphore): Process<A, Failures<E>> => {
  const scope = new Scope()

  // TODO: Need a way to dispose the acquisition
  const promise = acquire(s, scope, () => new Promise<A>(async (resolve, reject) => {
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
        const p = schedule(withContext(ir.value.context, ir.value.arg), s)
        scope.add(p)
        p.promise
          .finally(() => scope.remove(p))
          .catch(reject)
        ir = i.next(p)
      }
      else if (is(Fail, ir.value)) return reject(ir.value.arg)
      else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir.value)}`))
    }
    resolve(ir.value as A)
  }).finally(() => scope[Symbol.dispose]()))

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

class AbortControllerDisposable {
  constructor(private readonly controller: AbortController) { }
  [Symbol.dispose]() { this.controller.abort() }
}
