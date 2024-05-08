import { Effect, Fx, fx, ok } from '../fx'
import { fail } from './fail'
import { Task } from './fork/Task'

type Run<A> = (abort: AbortSignal) => Promise<A>

export class Async extends Effect<'fx/Async', Run<any>> { }

export const run = <const A>(run: Run<A>) => new Async(run).returning<A>()

export const wait = <const A, const E>(p: Task<A, E>) => fx(function* () {
  const r = yield* run<Fx<E, A>>(
    s => new Promise(resolve => p.promise.then(
      a => s.aborted || resolve(ok(a)),
      e => s.aborted || resolve(fail(e) as Fx<E, A>))
  ))

  return yield* r
}) as Fx<Async | E, A>
