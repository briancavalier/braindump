import { Process } from './concurrent/process'
import { Effect, Fx } from './fx'

type Run<A = any> = (f: (x: A) => void) => Disposable

export class Async extends Effect('Async')<Run> { }

export const async = <const A>(run: Run<A>) => new Async(run).send<A>()

export const wait = <const A>(p: Process<A>): Fx<Async, A> => async<A>(f => {
  p.promise.then(f)
  return p
})

export const tryPromise = <const A, const E = never>(
  run: (abort: AbortSignal) => Promise<A>,
  catchError?: (e: unknown) => E
) => async<A | E>(f => {
  const abort = new AbortController()
  run(abort.signal).then(f, catchError ? e => f(catchError(e)) : null)
  return { [Symbol.dispose]() { abort.abort() } }
})
