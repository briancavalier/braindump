export type Result<A> = Ok<A> | Fail

export type Ok<A> = { readonly tag: 'ok', readonly value: A }

export const ok = <A>(value: A) => ({ tag: 'ok', value }) as const
export const isOk = <A>(r: Result<A>): r is Ok<A> => r.tag === 'ok'

export type Fail = { readonly tag: string }

export const unexpected = <Schema>(schema: Schema, value: unknown) => ({ tag: 'unexpected', schema, value })
export const at = (key: string | number, error: Fail) => ({ tag: 'at', key, error })
export const missing = <Schema>(schema: Schema) => ({ tag: 'missing', schema })
export const all = (context: string, errors: readonly Fail[]) => ({ tag: 'all', context, errors })
export const any = <Schemas extends readonly unknown[]>(schemas: Schemas, errors: readonly Fail[]) => ({ tag: 'any', schemas, errors })
