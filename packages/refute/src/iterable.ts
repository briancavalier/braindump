export type Nat = number & { readonly Nat: true }

/**
 * Create a restartable iterable from a nullary Generator function
 */
export const gen = <A>(f: () => Generator<A, void, undefined>): Iterable<A> => ({
  [Symbol.iterator]: f
})

export const take = <A>(n: number, i: Iterable<A>) => gen(function* () {
  if (n === 0) return
  for (const a of i) {
    yield a
    if (--n === 0) return
  }
})

export const skip = <A>(n: number, i: Iterable<A>) => gen(function* () {
  for (const a of i) {
    if (n === 0) yield a
    else --n
  }
})

/**
 * Natural numbers N where 0 <= N < Math.ceil(max)
 */
export const upto = (max = 5): Iterable<Nat> => gen(function* () {
  const n = Math.ceil(max)
  for (let i = 0; i < n; i++) yield i as Nat
})
