export class Process<A, E> {
  private disposed = false

  public readonly E!: E

  constructor(public readonly promise: Promise<A>, public readonly dispose: Disposable) {}

  [Symbol.dispose]() {
    if(this.disposed) return
    this.disposed = true
    this.dispose[Symbol.dispose]()
  }
}

type Result<P> = P extends Process<infer A, unknown> ? A : never
type Errors<P> = P extends Process<unknown, infer E> ? E : never

export const all = <Processes extends readonly Process<unknown, unknown>[]>(...processes: Processes) => {
  const dispose = new DisposeAll(processes)
  return new Process(
    Promise.all(processes.map(p => p.promise)).finally(() => {
      console.log('all finally')
      dispose[Symbol.dispose]()
    }),
    dispose
  ) as Process<{ readonly [K in keyof Processes]: Result<Processes[K]> }, Errors<Processes[number]>>
}

export const race = <Processes extends readonly Process<unknown, unknown>[]>(...processes: Processes) => {
  const dispose = new DisposeAll(processes)
  return new Process(
    Promise.race(processes.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose
  ) as Process<Result<Processes[number]>, Errors<Processes[number]>>
}

class DisposeAll {
  constructor(private readonly processes: Iterable<Process<unknown, unknown>>) { }
  [Symbol.dispose]() { for (const p of this.processes) p.dispose[Symbol.dispose]() }
}
