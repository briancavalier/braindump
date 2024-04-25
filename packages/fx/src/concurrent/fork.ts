// eslint-disable-next-line import/no-cycle
import { Async } from '../async'
import { HandlerContext } from '../context'
import { Fail, Failures } from '../fail'
import { Effect, Fx, fx, is, ok } from '../fx'
import { handle, resume } from '../handler'

import { Process, all as processAll, race as processRace } from './process'
import { Scope } from './scope'
import { Semaphore } from './semaphore'

export class Fork extends Effect('fx/Fork.Fork')<Fx<unknown, unknown>, Process<unknown, unknown>> {
  constructor(f: Fx<unknown, unknown>, public readonly context: readonly HandlerContext[]) { super(f) }
}

export const fork = <const E, const A>(f: Fx<E, A>) =>
  new Fork(f, []).send() as Fx<Exclude<E, Async | Fail<any>> | Fork, Process<A, Errors<E>>>

export const all = <Fxs extends readonly Fx<unknown, unknown>[]>(...fxs: Fxs) => fx(function* () {
  const ps = [] as Process<unknown, unknown>[]
  for(const f of fxs) ps.push(yield* fork(f))
  return processAll(...ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>>, Process<{
  readonly [K in keyof Fxs]: ResultOf<Fxs[K]>
}, Errors<EffectsOf<Fxs[number]>>>>

export const race = <Fxs extends readonly Fx<unknown, unknown>[]>(...fxs: Fxs) => fx(function* () {
  const ps = [] as Process<unknown, unknown>[]
  for (const f of fxs) ps.push(yield* fork(f))
  return processRace(...ps)
}) as Fx<Exclude<EffectsOf<Fxs[number]>, Async | Fail<any>>, Process<ResultOf<Fxs[number]>, Errors<EffectsOf<Fxs[number]>>>>

type EffectsOf<F> = F extends Fx<infer E, unknown> ? E : never
type ResultOf<F> = F extends Fx<unknown, infer A> ? A : never
type Errors<E> = E extends Fail<infer F> ? F : never

export const unbounded = <const E, const A>(f: Fx<E, A>) =>
  bounded(f, Infinity)

export const bounded = <const E, const A>(f: Fx<E, A>, maxConcurrency: number) =>
  handle(f, [Fork], {
    initially: ok(new Semaphore(maxConcurrency)),
    handle: (f, s) => ok(resume(schedule(withContext(f.context, f.arg), s), s))
  })

export const schedule = <const E, const A>(f: Fx<E, A>, s: Semaphore): Process<A, Failures<E>> => {
  const scope = new Scope()

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
        if (scope.disposed) return
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
