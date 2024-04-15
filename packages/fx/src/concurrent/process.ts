export class Process<A> {
  private disposed = false

  constructor(public readonly promise: Promise<A>, public readonly dispose: Disposable) {}

  [Symbol.dispose]() {
    if(this.disposed) return
    this.disposed = true
    this.dispose[Symbol.dispose]()
  }
}

type Result<P> = P extends Process<infer A> ? A : never

export const all = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => {
  const dispose = new DisposeAll(processes)
  return new Process(
    Promise.all(processes.map(p => p.promise)).catch(e => (dispose[Symbol.dispose](), Promise.reject(e))),
    dispose
  ) as Process<{ readonly [K in keyof Processes]: Result<Processes[K]> }>
}

export const race = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => {
  const dispose = new DisposeAll(processes)
  return new Process(
    Promise.race(processes.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose
  ) as Process<Result<Processes[number]>>
}

class DisposeAll {
  constructor(private readonly processes: readonly Process<unknown>[]) { }
  [Symbol.dispose]() { for (const p of this.processes) p.dispose[Symbol.dispose]() }
}
