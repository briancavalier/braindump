export type Continue<A, R> = Resume<A> | Return<R>
export type Resume<A> = Readonly<{ done: false, value: A }>
export type Return<A> = Readonly<{ done: true, value: A }>
