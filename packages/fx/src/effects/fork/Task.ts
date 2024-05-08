export class Task<A, E> {
  private disposed = false

  public readonly E!: E

  constructor(public readonly promise: Promise<A>, public readonly dispose: Disposable, public readonly name?: string) {}

  [Symbol.dispose]() {
    if(this.disposed) return
    this.disposed = true
    this.dispose[Symbol.dispose]()
  }
}

type Result<P> = P extends Task<infer A, unknown> ? A : never
type Errors<P> = P extends Task<unknown, infer E> ? E : never

export const all = <Tasks extends readonly Task<unknown, unknown>[]>(tasks: Tasks, name?: string) => {
  const dispose = new DisposeAll(tasks)
  return new Task(
    Promise.all(tasks.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose,
    name
  ) as Task<{ readonly [K in keyof Tasks]: Result<Tasks[K]> }, Errors<Tasks[number]>>
}

export const race = <Tasks extends readonly Task<unknown, unknown>[]>(tasks: Tasks, name?: string) => {
  const dispose = new DisposeAll(tasks)
  return new Task(
    Promise.race(tasks.map(p => p.promise)).finally(() => dispose[Symbol.dispose]()),
    dispose,
    name
  ) as Task<Result<Tasks[number]>, Errors<Tasks[number]>>
}

class DisposeAll {
  constructor(private readonly tasks: Iterable<Task<unknown, unknown>>) { }
  [Symbol.dispose]() { for (const t of this.tasks) t.dispose[Symbol.dispose]() }
}
