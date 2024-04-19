import { Process } from './concurrent/process'
import { Effect, Fx } from './fx'

type Run<A = any> = (abort: AbortSignal) => Promise<A>

export class Async extends Effect('Async')<Run> { }

export const run = <const A>(run: Run<A>) => new Async(run).send<A>()

export const wait = <const A>(p: Process<A>): Fx<Async, A> => run<A>(
  s => new Promise((resolve) =>
    p.promise.then( x => s.aborted || resolve(x) )
  ))
