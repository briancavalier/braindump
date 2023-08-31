export interface Variant<T, A> {
  readonly tag: T
  readonly value: A
}

export const Variant = <const T>(t: T) => class Value<A> implements Variant<T, A> {
  readonly tag = t
  static readonly tag = t

  constructor(public readonly value: A) {}

  static is<V extends Variant<unknown, unknown>>(v: V): v is Extract<V, { readonly tag: T }> {
    return v.tag === t
  }

  static of<const A>(a: A): Variant<T, A> {
    return new Value(a)
  }
}

export const match = <V extends Variant<unknown, unknown>, M extends Matcher<V>>(v: V, m: M): ReturnType<M[keyof M]> =>
  m[v.tag as keyof M](v.value) as ReturnType<M[keyof M]>

export type Matcher<V> = U2I<Matchers<V>>

type Matchers<V> = V extends Variant<infer T extends PropertyKey, infer A>
  ? { readonly [t in T]: (a: A) => unknown }
  : unknown

type U2I<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
