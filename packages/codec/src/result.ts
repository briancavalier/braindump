export interface Ok<A> { readonly type: 'ok', readonly value: A }

export const isOk = <A>(r: Ok<A> | Fail): r is Ok<A> => r.type === 'ok'
export const isFail = <A>(r: Ok<A> | Fail): r is Fail => r.type !== 'ok'

export const ok = <A>(a: A) => ({ type: 'ok', value: a }) as const

export const sequence = <A extends readonly(Ok<any> | Fail)[]>(a: A): Sequence<A> => {
  const oks = a.filter(isOk)
  return (oks.length === a.length
    ? ok(oks.map(r => r.value))
    : all(a, a.filter(isFail))
  ) as Sequence<A>
}

export const unexpected = <S, I>(schema: S, input: I) => ({ type: 'unexpected', schema, input }) as const
export const missing = <K, S>(key: K, schema: S) => ({ type: 'missing', key, schema }) as const
export const at = <K, E>(key: K, error: E) => ({ type: 'at', key, error }) as const
export const stopped = <I, E>(input: I, error: E) => ({ type: 'stopped', input, error }) as const
export const none = <S, I, E extends readonly unknown[]>(schema: S, input: I, errors: E) => ({ type: 'none', schema, input, errors }) as const
export const all = <I, E extends readonly unknown[]>(input: I, errors: E) => ({ type: 'all', input, errors }) as const

export const failed = <S>(schema: S, message: string) => ({ type: 'failed', schema, message }) as const
export const thrown = <I, E>(input: I, error: E) => ({ type: 'thrown', input, error }) as const

export type Sequence<A extends readonly (Ok<unknown> | Fail)[]> =
    Ok<{ readonly [K in keyof A]: A[K] extends Ok<infer R> ? R : never }> | Fail

export type Fail =
  | ReturnType<typeof unexpected>
  | ReturnType<typeof missing>
  | ReturnType<typeof at>
  | ReturnType<typeof stopped>
  | ReturnType<typeof none>
  | ReturnType<typeof all>
  | ReturnType<typeof failed>
  | ReturnType<typeof thrown>
