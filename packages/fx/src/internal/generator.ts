import { Pipeable, pipe } from './pipe'

export class Once<Y, R> implements Generator<Y, R>, Pipeable {
  private called = false

  constructor(public readonly value: Y) {}

  next(r: R): IteratorResult<Y, R> {
    if(this.called) return { done: true, value: r }
    this.called = true
    return { done: false, value: this.value }
  }

  return(a: R): IteratorResult<Y, R> {
    return { value: a, done: true }
  }

  throw(e: unknown): IteratorResult<Y, R> {
    throw e
  }

  [Symbol.iterator](): Generator<Y, R> {
    return new Once<Y, R>(this.value)
  }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }
}

export class Ok<R> implements Generator<never, R>, Pipeable {
  constructor(public readonly value: R) {}

  next(): IteratorResult<never, R> {
    return { done: true, value: this.value }
  }

  return(a: R): IteratorResult<never, R> {
    return { value: a, done: true }
  }

  throw(e: unknown): IteratorResult<never, R> {
    throw e
  }

  [Symbol.iterator](): Generator<never, R> {
    return this
  }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }
}
