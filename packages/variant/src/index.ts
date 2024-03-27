export type Variant<T, A> = {
  readonly tag: T
  readonly value: A
}

export const of = <const T, const A>(tag: T, value: A) =>
  ({ tag, value }) as const

export const is = <const T>(t: T) => <V extends Variant<unknown, unknown>>(v: V): v is Extract<V, Variant<T, unknown>> =>
  v.tag === t

export const map = <const A extends Variant<unknown, unknown>, const B extends A, const C>(
  is: (a: A) => a is B,
  f: (b: B['value']) => C
) =>
  (a: A) => is(a)
    ? { ...a, value: f(a.value) } as { readonly [K in keyof B]: K extends 'value' ? C : B[K] }
    : (a as Exclude<A, B>)

export const chain = <const A extends Variant<unknown, unknown>, const B extends A, const C extends Variant<unknown, unknown>>(
  is: (a: A) => a is B,
  f: (b: B['value']) => C
) =>
  (a: A) => is(a)
    ? f(a.value)
    : (a as Exclude<A, B>)
