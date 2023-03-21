import { Result } from './result'

export type AnySchema =
  | StructuredSchema
  | AdhocSchema

type AdhocSchema =
  | number | string | boolean | null | undefined
  | { readonly [K in string]: AnySchema }
  | readonly AnySchema[]

type StructuredSchema =
  | UnknownSchema
  | NumberSchema
  | StringSchema
  | BooleanSchema
  | ArraySchema<unknown>
  | RecordSchema<PropertyKey, unknown>
  | UnionSchema<unknown>
  | RefineSchema<AnySchema, any, unknown>
  | MapSchema<AnySchema, any, any>

export type Infer<S> =
  S extends number | string | boolean | null | undefined ? S
  : S extends UnionSchema<infer A> ? A
  : S extends Schema<infer A> ? A
  : S extends { readonly [K in string]: AnySchema } ? { readonly [K in keyof S]: Infer<S[K]> }
  : S extends readonly AnySchema[] ? { readonly [K in keyof S]: Infer<S[K]> }
  : unknown

const type = Symbol()
export const name = Symbol()

export interface Schema<A> {
  readonly [type]?: A
  readonly [name]: string
}

export interface UnknownSchema extends Schema<unknown> { readonly [name]: 'unknown' }
export interface NumberSchema extends Schema<number> { readonly [name]: 'number' }
export interface StringSchema extends Schema<string> { readonly [name]: 'string' }
export interface BooleanSchema extends Schema<boolean> { readonly [name]: 'boolean' }

export const isStructuredSchema = (s: AnySchema): s is StructuredSchema => s != null && typeof s === 'object' && name in s

export const unknown: UnknownSchema = { [name]: 'unknown' }
export const number: NumberSchema = { [name]: 'number' }
export const string: StringSchema = { [name]: 'string' }
export const boolean: BooleanSchema = { [name]: 'boolean' }

export interface ArraySchema<A> extends Schema<A> {
  readonly [name]: 'array',
  readonly schema: AnySchema
}

export const array = <S extends AnySchema>(schema: S): ArraySchema<readonly Infer<S>[]> =>
  ({ [name]: 'array', schema })

type KeySchema = string | Schema<string>

export interface RecordSchema<K extends PropertyKey, V> extends Schema<Readonly<Record<K, V>>> {
  readonly [name]: 'record',
  readonly keys: KeySchema
  readonly values: AnySchema
}

export const record = <K extends KeySchema, V extends AnySchema>(keys: K, values: V): RecordSchema<Infer<K>, Infer<V>> =>
  ({ [name]: 'record', keys, values })

export interface UnionSchema<A> extends Schema<A> {
  readonly [name]: 'union',
  readonly schemas: readonly AnySchema[]
}

export const union = <Schemas extends [AnySchema, AnySchema, ...readonly AnySchema[]]>(...schemas: Schemas): UnionSchema<Infer<Schemas[number]>> =>
  ({ [name]: 'union', schemas })

export interface RefineSchema<S, A, B extends A> extends Schema<B> {
  readonly [name]: 'refine',
  readonly type: string | undefined,
  readonly schema: S,
  readonly refine: (a: A) => a is B
}

export const refine = <A extends Infer<S>, B extends A, S>(schema: S, refine: (a: Infer<S>) => a is B, type?: string): RefineSchema<S, Infer<S>, B> =>
  ({ [name]: 'refine', type, schema, refine })

export interface MapSchema<S, A, B> extends Schema<B> {
  readonly [name]: 'map',
  readonly schema: S,
  readonly ab: (a: A) => Result<B>,
  readonly ba: (b: B) => Result<A>
}

export const map = <A extends Infer<S>, B, S>(schema: S, ab: (a: A) => Result<B>, ba: (b: B) => Result<A>): MapSchema<S, A, B> =>
  ({ [name]: 'map', schema, ab, ba })
