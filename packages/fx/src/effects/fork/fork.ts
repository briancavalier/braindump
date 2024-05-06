import { Effect, Fx, fx, is, ok } from '../../fx'
// eslint-disable-next-line import/no-cycle
import { Handler } from '../../handler'
import { HandlerContext, HandlerFx } from '../../handler/RunHandler'
// eslint-disable-next-line import/no-cycle
import { Async } from '../async'
import { Fail, Failures } from '../fail'

import { Process, all as processAll, race as processRace } from './process'
import { Scope } from './scope'
import { Semaphore } from './semaphore'

export class Fork extends Effect<'fx/Fork', ForkContext, Process<unknown, unknown>> { }

export const fork = <const E, const A>(fx: Fx<E, A>) =>
  new Fork({ fx, context: [] }) as Fx<Exclude<E, Async | Fail<any>> | Fork, Process<A, Errors<E>>>

export type ForkContext = Readonly<{
  fx: Fx<unknown, unknown>,
  context: readonly HandlerContext[]
}>

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

export const bounded = (maxConcurrency: number) => <const E, const A>(f: Fx<E, A>) =>
  Handler
    .initially(ok(new Semaphore(maxConcurrency)))
    .on(Fork, ({ fx, context }, s) => ok(Handler.resume(schedule(withContext(context, fx), s), s)))
    .handle(f)

export const unbounded = bounded(Infinity)

export const schedule = <const E, const A>(f: Fx<E, A>, s: Semaphore): Process<A, Failures<E>> => {
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
        const p = schedule(withContext(ir.value.arg.context, ir.value.arg.fx), s)
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
  c.reduce((f, handler) =>
    handler.forkable
      ? new HandlerFx(f, true, handler.state, handler.handlers, undefined, undefined, handler._return)
      : f,
    f)

class AbortControllerDisposable {
  constructor(private readonly controller: AbortController) { }
  [Symbol.dispose]() { this.controller.abort() }
}

class IteratorDisposable {
  constructor(private readonly iterator: Iterator<unknown>) { }
  [Symbol.dispose]() { this.iterator.return?.() }
}
