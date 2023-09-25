export type Ok<A> = { readonly type: 'ok', readonly value: A }
export type Fail = { readonly type: string }

export const isOk = <A>(r: Ok<A> | Fail): r is Ok<A> => r.type === 'ok'

export const ok = <A>(a: A) => ({ type: 'ok', value: a }) as const

export const unexpected = <S, I>(s: S, i: I) => ({ type: 'unexpected', schema: s, input: i }) as const
export const missing = <K, S>(k: K, s: S) => ({ type: 'missing', key: k, schema: s }) as const
export const at = <K, E>(k: K, e: E) => ({ type: 'at', key: k, error: e }) as const
export const none = <I, E extends readonly unknown[]>(i: I, e: E) => ({ type: 'none', input: i, errors: e }) as const
export const all = <I, E extends readonly unknown[]>(i: I, e: E) => ({ type: 'all', input: i, errors: e }) as const
export const thrown = <I, E>(i: I, e: E) => ({ type: 'thrown', input: i, error: e }) as const
