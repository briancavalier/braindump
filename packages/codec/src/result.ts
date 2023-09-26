export type Ok<A> = { readonly type: 'ok', readonly value: A }

export const isOk = <A>(r: Ok<A> | Fail): r is Ok<A> => r.type === 'ok'

export const ok = <A>(a: A) => ({ type: 'ok', value: a }) as const

export const unexpected = <S, I>(s: S, i: I) => ({ type: 'unexpected', schema: s, input: i }) as const
export const missing = <K, S>(k: K, s: S) => ({ type: 'missing', key: k, schema: s }) as const
export const at = <K, E>(k: K, e: E) => ({ type: 'at', key: k, error: e }) as const
export const none = <S, I, E extends readonly unknown[]>(s: S, i: I, e: E) => ({ type: 'none', schema: s, input: i, errors: e }) as const
export const all = <I, E extends readonly unknown[]>(i: I, e: E) => ({ type: 'all', input: i, errors: e }) as const
export const thrown = <I, E>(i: I, e: E) => ({ type: 'thrown', input: i, error: e }) as const

export type Fail =
  | ReturnType<typeof unexpected>
  | ReturnType<typeof missing>
  | ReturnType<typeof at>
  | ReturnType<typeof none>
  | ReturnType<typeof all>
  | ReturnType<typeof thrown>
