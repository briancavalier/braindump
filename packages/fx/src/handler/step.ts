export type Step<A, R, S> = Resume<A, S> | Return<R>
export type Resume<A, S = void> = { tag: 'resume'; value: A; state: S}
export type Return<A> = { tag: 'return'; value: A}

export function resume<const A>(a: A): Resume<A>
export function resume<const A, const S>(a: A, s: S): Resume<A, S>
export function resume<const A, const S>(a: A, s?: S): Resume<A, void | S> {
  return ({ tag: 'resume', value: a, state: s }) as const
}

export const done = <const A>(a: A): Step<never, A, never> => ({ tag: 'return', value: a })
