import { Async, async } from '../async'
import { Context, getContext, setContext } from '../context'
import { provideAll } from '../env'
import { Fx, of, isEffect, Effect } from '../fx'
import { handle } from '../handle'

export class Concurrent extends Effect('Concurrent')<Fx<unknown, unknown>> { }

export const fork = <const E, const A>(f: Fx<E, A>) => new Concurrent(f) as Fx<Exclude<E, Async> | Concurrent, Process<A>>

export type Process<A> = {
  promise: Promise<A>
  dispose: Disposable,
}

type Result<P> = P extends Process<infer A> ? A : never

export const wait = <const A>(p: Process<A>): Fx<Async, A> => async<A>(f => {
  let disposed = false
  p.promise.then(a => disposed || f(a))
  return { [Symbol.dispose]() { disposed = true } }
})

type All<Processes extends readonly Process<unknown>[]> = {
  readonly [K in keyof Processes]: Processes[K] extends Process<infer A> ? A : never
}

export const all = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => ({
  promise: Promise.all(processes.map(p => p.promise)),
  dispose: { [Symbol.dispose]() { processes.forEach(p => p.dispose[Symbol.dispose]()) } }
}) as Process<All<Processes>>

type Race<Processes extends readonly Process<unknown>[]> = Result<Processes[number]>

export const race = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => {
  const dispose = { [Symbol.dispose]() { processes.forEach(p => p.dispose[Symbol.dispose]()) } }
  return {
    promise: Promise.race(processes.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose
  } as Process<Race<Processes>>
}

export const run = <const R>(f: Fx<Async | Concurrent, R>): Process<R> =>
  getResult(handleConcurrent(fork(provideAll({}, f))))

const getResult = <const R>(f: Fx<never, R>): R => f[Symbol.iterator]().next().value

export const handleConcurrent = <const E, const A>(f: Fx<E, A>) => handle(f, {Concurrent}, {
  handle: c => of(spawnAsync(c.arg as Fx<any, unknown>, [...getContext()]))
})

export const spawnAsync = (f: Fx<unknown, unknown>, context: Context[]) => {
  const disposables = [] as Disposable[]
  let currentDisposable: Disposable | undefined
  const dispose = {
    [Symbol.dispose]() {
      disposables.forEach(d => d[Symbol.dispose]())
      currentDisposable && currentDisposable[Symbol.dispose]()
    }
  }

  const promise = new Promise((resolve, reject) => {
    setImmediate(async () => {
      const fc = withContext(context, f)
      setContext(context)
      const i2 = fc[Symbol.iterator]()
      let ir2 = i2.next()
      while (!ir2.done) {
        if (isEffect(Async, ir2.value)) {
          const p = runProcess(ir2.value.arg)
          currentDisposable = p.dispose
          const a = await p.promise
          currentDisposable = undefined
          setContext(context)
          ir2 = i2.next(a)
        }
        else if (isEffect(Concurrent, ir2.value)) {
          const p = spawnAsync(ir2.value.arg, context)
          disposables.push(p.dispose)
          ir2 = i2.next(p.promise)
        }
        else return reject(new Error(`Unexpected effect in forked Fx: ${JSON.stringify(ir2.value)}`))
      }
      resolve(ir2.value)
    })
  })

  return { dispose, promise }
}
const runProcess = <A>(run: (f: (a: A) => void) => Disposable) => {
  let dispose: Disposable
  return {
    dispose: { [Symbol.dispose]() { dispose[Symbol.dispose]() } },
    promise: new Promise<A>(resolve => dispose = run(resolve))
  }
}

const withContext = (c: Context[], f: Fx<unknown, unknown>) =>
  c.reduceRight((f, c) => handle(f, c.effects, c.handler as any), f)
