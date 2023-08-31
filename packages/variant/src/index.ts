export interface Variant<T, A> {
  readonly tag: T
  readonly value: A
}

export const Variant = <const T>(t: T) => class Value<A> implements Variant<T, A> {
  readonly tag = t
  static tag = t
  constructor(public readonly value: A) {}
  static is = <V extends Variant<unknown, unknown>>(v: V): v is Extract<V, { readonly tag: T }> => v.tag === t
  static of = <const A>(a: A): Variant<T, A> => new Value(a)
}
