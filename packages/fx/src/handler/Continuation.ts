export type Step<A, R, S> = Resume<A, S> | Return<R>
export type Resume<A, S = void> = { tag: 'resume'; value: A; state: S}
export type Return<A> = { tag: 'return'; value: A}
