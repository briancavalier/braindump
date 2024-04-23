import { Scope } from './scope'

export class Semaphore {
  private waiters: (() => void)[] = [];
  constructor(private available: number) { }

  acquire() {
    if (this.available > 0) {
      this.available--
      return acquired()
    }

    return acquiring(this.waiters)
  }

  release() {
    if (this.waiters.length) this.waiters.shift()!()
    else this.available++
  }
}

export const acquire = <A>(s: Semaphore, scope: Scope, f: () => Promise<A>) => {
  const a = s.acquire()
  scope.add(a)
  return a.promise.then(f).finally(() => {
    scope.remove(a)
    s.release()
  })
}

const acquired = () => ({
  promise: Promise.resolve(),
  [Symbol.dispose]() { }
})

const acquiring = (waiters: (() => void)[]) => {
  let resolve: () => void
  return {
    promise: new Promise<void>(r => {
      resolve = r
      waiters.push(r)
    }),
    [Symbol.dispose]: () => {
      const i = waiters.indexOf(resolve!)
      if (i >= 0) waiters.splice(i, 1)
    }
  }
}
