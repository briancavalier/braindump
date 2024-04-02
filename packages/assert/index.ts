
import { dequal } from 'dequal'

export type Ok<A> = { ok: true, value: A, message: string }
export type Fail<E> = { ok: false, value: E, message: string }

export type Assertion<A, E> = Ok<A> | Fail<E>

export const ok = <A>(a: A, message = '') =>
  ({ ok: true, value: a, message }) as const

export const fail = <E>(e: E, message = '') =>
  ({ ok: false, value: e, message }) as const

export function assert<A, E>(a: Assertion<A, E>): A
export function assert<A, E>(a: Promise<Assertion<A, E>>): Promise<A>
export function assert<A, E>(a: Assertion<A, E> | Promise<Assertion<A, E>>): A | Promise<A> {
  return a instanceof Promise ? a.then(assert<A, E>) // Why does TS need this instantiation?
    : a.ok ? a.value
      : throwAssertionError(a.value, a.value, a.message, '', assert)
}

export function not<A, E>(a: Assertion<A, E>): Assertion<E, A>
export function not<A, E>(a: Promise<Assertion<A, E>>): Promise<Assertion<E, A>>
export function not<A, E>(a: Assertion<A, E> | Promise<Assertion<A, E>>): any {
  return a instanceof Promise ? a.then(not)
    : { ...a, ok: !a.ok }
}

export const eq = <A>(a1: A, a2: A, message = ''): Assertion<A, A> =>
  ({ ok: dequal(a1, a2), value: a1, message })

export const rejects = <A>(p: Promise<A>, message = ''): Promise<Assertion<unknown, A>> =>
  p.then(
    x => ({ ok: false, value: x, message }),
    e => ({ ok: true, value: e, message })
  )

export const throws = <A>(f: () => A, message = ''): Assertion<unknown, A> => {
  try {
    return { ok: false, value: f(), message }
  } catch (e) {
    return { ok: true, value: e, message }
  }
}

// export const assert = (a: boolean, message?: string): asserts a is true =>
//   a ? undefined : fail(a, true, message ?? 'assertion failed', 'assert', assert)

// export const eq = <A, B>(a1: A, a2: B, message?: string): asserts a1 is A & B =>
//   dequal(a1, a2) ? undefined : fail(a1, a2, message, 'eq', eq)

// export const rejects = <A>(p: Promise<A>, message?: string): Promise<unknown> =>
//   p.then(
//     x => fail(x, undefined, message ?? `expected rejected Promise, but fulfilled with ${x}`, 'rejects', rejects),
//     e => e
//   )

// export const throws = (f: () => unknown, message?: string): unknown => {
//   let x
//   try {
//     x = f()
//   } catch(e) {
//     return e
//   }
//   fail(x, undefined, message ?? `expected throw, but returned ${x}`, 'throws', throws)
// }

const throwAssertionError = <A, B, O> (actual: A, expected: B, message: string | undefined, operator: O, f ?: (...a: readonly any[]) => unknown): never => {
  throw new AssertionError(actual, expected, message, operator, f)
}

class AssertionError<A, B, O> extends Error {
  generatedMessage: boolean
  actual: A
  expected: B
  operator: O

  constructor(actual: A, expected: B, message: string | undefined, operator: O, f?: (...a: readonly any[]) => unknown) {
    if (message) {
      super(message)
    } else {
      super(`${actual}`.slice(0, 128) + ` ${operator} ` + `${expected}`.slice(0, 128))
    }

    this.generatedMessage = !message
    this.name = 'AssertionError'
    this.actual = actual
    this.expected = expected
    this.operator = operator

    if(typeof Error.captureStackTrace === 'function')
      Error.captureStackTrace(this, f)
  }
}

const a = 'hello' as string
const x = assert(not(rejects(Promise.reject(123))))
console.log(x, a)
