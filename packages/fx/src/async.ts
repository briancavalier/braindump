import { Effect, Fx, Result } from './fx'

export class Async extends Effect('Wait')<(f: (x: any) => void) => Disposable> { }

export const async = <const A>(run: (f: (a: A) => void) => Disposable) => new Async(run).request<A>()

export const wait = <const A>(p: Promise<A>): Fx<Async, A> => async<A>(f => {
  p.then(f)
  return { [Symbol.dispose]() { } }
})

export class Concurrent extends Effect('Concurrent')<Fx<unknown, unknown>> { }

export const fork = <const F extends Fx<Async | Concurrent, unknown>>(f: F) => new Concurrent(f).request<Promise<Result<F>>>()
