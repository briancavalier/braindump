import { Async, run } from './effects/async'
import { Fail, catchFail } from './effects/fail'
import { Semaphore } from './effects/fork/semaphore'
import { Fx, fx, is, ok } from './fx'

const RefType = Symbol('Ref')

export class Ref<A> {
  public readonly id = RefType
  constructor(private value: A) {}

  get() {
    return this.value
  }

  update(f: (a: A) => A) {
    this.value = f(this.value)
  }
}

const SRefType = Symbol('SRef')

export class SRef<A> {
  public readonly id = SRefType
  private readonly semaphore = new Semaphore(1)

  constructor(private value: A) {}

  get() {
    return ok(this.value)
  }

  update<E>(f: (a: A) => Fx<E, A>): Fx<E | Async, A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return fx(function* () {
      const a = self.semaphore.acquire()
      yield* run((signal) => {
        signal.addEventListener('abort', () => a[Symbol.dispose]())
        return a.promise
      })

      const r = yield* catchFail(f(self.value))
      try {
        return is(Fail, r) ? (yield* r) as never : (self.value = r)
      } finally {
        self.semaphore.release()
      }
    })
  }
}
