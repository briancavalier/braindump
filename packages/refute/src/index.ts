type Nat = number & { readonly Nat: true }

const gen = <A>(f: () => Generator<A, void, undefined>): Iterable<A> => ({
  [Symbol.iterator]: f
})

export type Series<A> = (d: Iterable<Nat>) => Iterable<A>

export const nat = (d: Iterable<Nat>) => d

export function* int(d: Iterable<Nat>) {
  for(const n of d) yield n, yield -n
}

export function* boolean(d: Iterable<Nat>) {
  for(const n of d)
    return yield* ((n % 2) === 0 ? [false, true] : [true, false])
}

export const pick = <A extends readonly [unknown, ...readonly unknown[]]>(...a: A): Series<A[number]> =>
  () => a

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export function* string(d: Iterable<Nat>) {
  for(const n of d) yield chars.padEnd(n, chars).slice(0, n)
}

export const array = <A>(s: Series<A>): Series<readonly A[]> =>
  function* (d) {
    for(const n of d) yield [...take(n, s(d))]
  }

export const tuple = <SS extends readonly [Series<unknown>, Series<unknown>, ...readonly Series<unknown>[]]>(...ss: SS): Series<TupleFrom<SS>> =>
  d => tupleCartesian(ss, d)

type TupleFrom<SS extends readonly Series<unknown>[]> = {
  readonly [K in keyof SS]: SS[K] extends Series<infer A> ? A : never
}

function* tupleCartesian <SS extends readonly Series<unknown>[]>(ss: SS, d: Iterable<Nat>): Iterable<TupleFrom<SS>> {
  if (ss.length === 0) return yield [] as TupleFrom<SS>

  const [s0, ...st] = ss
  for (const a of s0(d))
    for (const tail of tupleCartesian(st, d))
      yield [a, ...tail] as TupleFrom<SS>
}

export const record = <R extends Record<string, Series<unknown>>>(r: R): Series<RecordFrom<R>> =>
  d => recordCartesian(r, d)

type RecordFrom<R extends Record<string, Series<unknown>>> = {
  readonly [K in keyof R]: R[K] extends Series<infer A> ? A : never
}

function* recordCartesian<R extends Record<string, Series<unknown>>>(r: R, d: Iterable<Nat>): Iterable<RecordFrom<R>> {
    const keys = Object.keys(r)
    if(keys.length === 0) return yield {} as RecordFrom<R>

    const [k0] = keys
    const { [k0]: v0, ...vs } = r
    for(const a of v0(d))
      for (const rest of recordCartesian(vs, d))
        yield { [k0]: a, ...rest } as RecordFrom<R>
  }

export const pipe: {
  <A, B>(s: A, ab: (s: A) => B): B
  <A, B, C>(s: A, ab: (s: A) => B, bc: (s: B) => C): C
  <A, B, C, D>(s: A, ab: (s: A) => B, bc: (s: B) => C, cd: (s: C) => D): D
} = (s: any, ...[ab, ...fs]: readonly ((s: any) => any)[]) => fs.reduce((s, f) => f(s), ab(s))

export const where: {
  <A, B extends A>(p: (a: A) => a is B): (s: Series<A>) => Series<B>
  <A>(p: (a: A) => boolean): (s: Series<A>) => Series<A>
} = <A>(p: (a: A) => boolean) => (s: Series<A>): Series<A> =>
  function* (d) {
    for(const a of s(d)) if(p(a)) yield a
  }

export const map = <A, B>(f: (a: A) => B) => (s: Series<A>): Series<B> =>
  function* (d) {
    for(const a of s(d)) yield f(a)
  }

export const apply = <A extends readonly any[], B>(f: (...a: A) => B) => (s: Series<A>): Series<B> =>
  function* (d) {
    for (const a of s(d)) yield f(...a)
  }

export const n = (exclusiveMax: Nat): Iterable<Nat> => gen(function* () {
  for (let i = 0; i < exclusiveMax; i++) yield i as Nat
})

export const take = <A>(n: number, i: Iterable<A>) => gen(function* () {
  if (n === 0) return
  for (const a of i) {
    yield a
    if (--n === 0) return
  }
})
