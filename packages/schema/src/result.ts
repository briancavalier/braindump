import { AnySchema } from './schema'

export type Result<A> = Ok<A> | Fail

export type Ok<A> = { tag: 'ok', value: A }

export const ok = <A>(value: A) => ({ tag: 'ok', value }) as const
export const isOk = <A>(r: Result<A>): r is Ok<A> => r.tag === 'ok'

export type Fail =
  | Readonly<{ tag: 'unexpected', schema: AnySchema, value: unknown }>
  | Readonly<{ tag: 'at', key: string | number, error: Fail }>
  | Readonly<{ tag: 'missing', schema: AnySchema, key: string | number }>
  | Readonly<{ tag: 'all', context: string, errors: readonly Fail[] }>
  | Readonly<{ tag: 'any', schemas: readonly AnySchema[], errors: readonly Fail[] }>

export const unexpected = (schema: AnySchema, value: unknown): Fail => ({ tag: 'unexpected', schema, value })
export const at = (key: string | number, error: Fail): Fail => ({ tag: 'at', key, error })
export const missing = (key: string | number, schema: AnySchema): Fail => ({ tag: 'missing', key, schema })
export const all = (context: string, errors: readonly Fail[]): Fail => ({ tag: 'all', context, errors })
export const any = (schemas: readonly AnySchema[], errors: readonly Fail[]): Fail => ({ tag: 'any', schemas, errors })
