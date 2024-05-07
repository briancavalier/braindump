import { inspect } from 'node:util'

import { Fx, fx, is, ok } from '../../fx'
import { Handler, handle, resume } from '../../handler'
import { HandlerContext } from '../../handler/HandlerContext'
import { Async } from '../async'
import { Fail, Failures } from '../fail'

import { Fork } from './Fork'
import { Process } from './process'
import { Scope } from './scope'
import { Semaphore } from './semaphore'

export const bounded = (maxConcurrency: number) => <const E, const A>(f: Fx<E, A>) => fx(function* () {
    const s = new Semaphore(maxConcurrency)
    return yield* f.pipe(
      handle(Fork, ({ fx, context }) => ok(resume(runFork(withContext(context, fx), s))))
    )
  }) as Fx<Exclude<E, Async | Fail<any>>, Process<A, Failures<E>>>

export const unbounded = bounded(Infinity)

export const runFork = <const E, const A>(f: Fx<E, A>, s: Semaphore): Process<A, Failures<E>> => {
  const scope = new Scope()

  const promise = acquire(s, scope, () => new Promise<A>(async (resolve, reject) => {
    const i = f[Symbol.iterator]()
    scope.add(new IteratorDisposable(i))
    let ir = i.next()

    while (!ir.done) {
      if (is(Async, ir.value)) {
        const p = runProcess(ir.value.arg)
        scope.add(p)
        const a = await p.promise
          .finally(() => scope.remove(p))
          .catch(reject)
        // stop if the scope was disposed while we were waiting
        if (scope.disposed) return
        ir = i.next(a)
      }
      else if (is(Fork, ir.value)) {
        const p = runFork(withContext(ir.value.arg.context, ir.value.arg.fx), s)
        scope.add(p)
        p.promise
          .finally(() => scope.remove(p))
          .catch(reject)
        ir = i.next(p)
      }
      else if (is(Fail, ir.value)) return reject(ir.value.arg)
      else return reject(new Error(`Unexpected effect in forked Fx: ${inspect(ir.value)} ${inspect(f)}`))
    }
    resolve(ir.value as A)
  }).finally(() => scope[Symbol.dispose]()))

  return new Process(promise, scope)
}

export const acquire = <A>(s: Semaphore, scope: Scope, f: () => Promise<A>) => {
  const a = s.acquire()
  scope.add(a)
  return a.promise.then(f).finally(() => {
    scope.remove(a)
    s.release()
  })
}

const runProcess = <A>(run: (s: AbortSignal) => Promise<A>) => {
  const s = new AbortController()
  return new Process<A, unknown>(run(s.signal), new AbortControllerDisposable(s))
}

const withContext = (c: readonly HandlerContext[], f: Fx<unknown, unknown>) =>
  c.reduce((f, handler) => new Handler(f, handler.handlers, new Map()), f)

class AbortControllerDisposable {
  constructor(private readonly controller: AbortController) { }
  [Symbol.dispose]() { this.controller.abort() }
}

class IteratorDisposable {
  constructor(private readonly iterator: Iterator<unknown>) { }
  [Symbol.dispose]() { this.iterator.return?.() }
}
