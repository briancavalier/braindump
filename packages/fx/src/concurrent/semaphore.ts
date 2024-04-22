export class Semaphore {
  private waiters: (() => void)[] = [];
  constructor(private available: number) { }

  acquire() {
    if (this.available > 0) {
      this.available--
      return Promise.resolve()
    }
    return new Promise<void>(resolve => this.waiters.push(resolve))
  }

  release() {
    if (this.waiters.length) this.waiters.shift()!()
    else this.available++
  }
}
