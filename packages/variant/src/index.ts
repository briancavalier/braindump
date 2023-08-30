export interface Variant<T, A> {
  readonly tag: T
  readonly value: A
}

export const Variant = <const T>(t: T) => class Value<A> implements Variant<T, A> {
  readonly tag = t
  static tag = t
  constructor(public readonly value: A) {}
  static is = <A>(v: Variant<unknown, A>): v is Variant<T, A> => v.tag === t
  static of = <const A>(a: A): Variant<T, A> => new Value(a)
}
