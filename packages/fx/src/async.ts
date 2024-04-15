import { Process } from './concurrent'
import { Effect, Fx } from './fx'

export class Async extends Effect('Wait')<(f: (x: any) => void) => Disposable> { }

export const async = <const A>(run: (f: (a: A) => void) => Disposable) => new Async(run).request<A>()

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
