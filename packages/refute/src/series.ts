import { Nat, take } from './iterable'

export type Series<A> = (d: Iterable<Nat>) => Iterable<A>

export type ItemType<S extends Series<unknown>> = S extends Series<infer A> ? A : never

export const nat = (d: Iterable<Nat>) => d

export function* int(d: Iterable<Nat>) {
  for (const n of d) yield n, yield -n
}

export function* float(d: Iterable<Nat>) {
  for (const n of d) {
    if (n === 0) yield 0, yield -0
    else if (n === 1) yield 1, yield -1
    else if (n === 2) yield .5, yield -.5
    else {
      const x = 1 / n
      const x1 = 1 - x
      yield x, yield -x, yield x1, yield -x1
    }
  }
}

export function* boolean(d: Iterable<Nat>) {
  for (const n of d) return yield* (n % 2) === 0 ? [false, true] : [true, false]
}

export const stringOf = (chars: string): Series<string> => function* (d) {
  for (const n of d) yield chars.padEnd(n, chars).slice(0, n)
}

export const string = stringOf('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

export const just = <A>(a: A): Series<A> => () => [a]

export const pick = <A extends readonly [unknown, ...readonly unknown[]]>(...a: A): Series<A[number]> =>
  () => a

export const union = <SS extends readonly [Series<unknown>, Series<unknown>, ...readonly Series<unknown>[]]>(...ss: SS): Series<Interleave<SS>> =>
  function* (d) {
    const si = ss.map(s => s(d)[Symbol.iterator]())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of d) {
      for (const i of si) {
        const r = i.next()
        if (!r.done) yield r.value as Interleave<SS>
      }
    }
  }

type Interleave<SS extends readonly Series<unknown>[]> = ItemType<SS[number]>

export const array = <A>(s: Series<A>): Series<readonly A[]> =>
  function* (d) {
    for (const n of d) yield [...take(n, s(d))]
  }

export const tuple = <SS extends readonly [Series<unknown>, Series<unknown>, ...readonly Series<unknown>[]]>(...ss: SS): Series<TupleFrom<SS>> =>
  d => tupleCartesian(ss, d)

type TupleFrom<SS extends readonly Series<unknown>[]> = {
  readonly [K in keyof SS]: SS[K] extends Series<infer A> ? A : never
}

function* tupleCartesian<SS extends readonly Series<unknown>[]>(ss: SS, d: Iterable<Nat>): Iterable<TupleFrom<SS>> {
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
  if (keys.length === 0) return yield {} as RecordFrom<R>

  const [k0] = keys
  const { [k0]: v0, ...vs } = r
  for (const a of v0(d))
    for (const rest of recordCartesian(vs, d))
      yield { [k0]: a, ...rest } as RecordFrom<R>
}

export const where: {
  <A, B extends A>(p: (a: A) => a is B): (s: Series<A>) => Series<B>
  <A>(p: (a: A) => boolean): (s: Series<A>) => Series<A>
} = <A>(p: (a: A) => boolean) => (s: Series<A>): Series<A> =>
  function* (d) {
    for (const a of s(d)) if (p(a)) yield a
  }

export const map = <A, B>(f: (a: A) => B) => (s: Series<A>): Series<B> =>
  function* (d) {
    for (const a of s(d)) yield f(a)
  }

export const apply = <A extends readonly any[], B>(f: (...a: A) => B) => (s: Series<A>): Series<B> =>
  function* (d) {
    for (const a of s(d)) yield f(...a)
  }

export const pipe: {
  <A, B>(s: A, ab: (s: A) => B): B
  <A, B, C>(s: A, ab: (s: A) => B, bc: (s: B) => C): C
  <A, B, C, D>(s: A, ab: (s: A) => B, bc: (s: B) => C, cd: (s: C) => D): D
} = (s: any, ...[ab, ...fs]: readonly ((s: any) => any)[]) => fs.reduce((s, f) => f(s), ab(s))
