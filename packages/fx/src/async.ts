import { Process } from './concurrent/process'
import { fail, type Fail } from './fail'
import { Effect, Fx, fx, ok } from './fx'

type Run<A> = (abort: AbortSignal) => Promise<A>

export class Async extends Effect('Async')<Run<any>> { }

export const run = <const A>(run: Run<A>) => new Async(run).send<A>()

export const wait = <const A, const E>(p: Process<A, E>) => fx(function* () {
  const r = yield* run<AsyncResult<A, E>>(
    s => new Promise(resolve => p.promise.then(
      a => s.aborted || resolve(ok(a)),
      e => s.aborted || resolve(fail(e)))
  ))

  return yield* r
}) as Fx<Async | FailIf<E>, A>

type FailIf<E> = E extends unknown ? Fail<E> : never

type AsyncResult<A, E> = Fx<never, A> | Fx<Fail<E>, never>
