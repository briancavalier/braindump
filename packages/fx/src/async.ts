import { Process } from './concurrent/process'
import { Effect, Fx } from './fx'

type Run<A = any> = (f: (x: A) => void) => Disposable

export class Async extends Effect('Async')<Run> { }

export const run = <const A>(run: Run<A>) => new Async(run).send<A>()

export const wait = <const A>(p: Process<A>): Fx<Async, A> => run<A>(f => {
  p.promise.then(f)
  return p
})

export const tryPromise = <const A, const E = never>(
  runPromise: (abort: AbortSignal) => Promise<A>,
  catchError?: (e: unknown) => E
) => run<A | E>(f => {
  const abort = new AbortController()
  runPromise(abort.signal).then(f, catchError ? e => f(catchError(e)) : null)
  return { [Symbol.dispose]() { abort.abort() } }
})
