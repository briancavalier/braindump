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

type All<Processes extends readonly Process<unknown>[]> = {
  readonly [K in keyof Processes]: Result<Processes[K]>
}

export const all = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => {
  const dispose = { [Symbol.dispose]() { processes.forEach(p => p.dispose[Symbol.dispose]()) } }
  return new Process(
    Promise.all(processes.map(p => p.promise)).catch(e => (dispose[Symbol.dispose](), Promise.reject(e))),
    dispose
  ) as Process<All<Processes>>
}

type Race<Processes extends readonly Process<unknown>[]> = Result<Processes[number]>

export const race = <Processes extends readonly Process<unknown>[]>(...processes: Processes) => {
  const dispose = { [Symbol.dispose]() { processes.forEach(p => p.dispose[Symbol.dispose]()) } }
  return new Process(
    Promise.race(processes.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose
  ) as Process<Race<Processes>>
}
