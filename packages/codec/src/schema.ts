import { Codec, RefineCodec, SchemaCodec, name } from './codec'

export interface NumberSchema { readonly [name]: 'number' }
export const number: NumberSchema = { [name]: 'number' }

export interface StringSchema { readonly [name]: 'string' }
export const string: StringSchema = { [name]: 'string' }

export interface BooleanSchema { readonly [name]: 'boolean' }
export const boolean: BooleanSchema = { [name]: 'boolean' }

export interface ArraySchema<Schema> {
  readonly [name]: 'array',
  readonly items: Schema
}

export const array = <const S extends Schema>(items: S): ArraySchema<S> => ({ [name]: 'array', items })

export interface RecordSchema<K, V> {
  readonly [name]: 'record',
  readonly keys: K,
  readonly values: V
}

type PropertyKeySchema = string | StringSchema | Codec<any, string>

export const record = <K extends PropertyKeySchema, V>(keys: K, values: V): RecordSchema<K, V> => ({ [name]: 'record', keys, values })

export interface UnionSchema<Schemas extends readonly unknown[]> {
  readonly [name]: 'union',
  readonly schemas: Schemas
}

export const union = <const Schemas extends readonly [Schema, Schema, ...readonly Schema[]]>(...schemas: Schemas): UnionSchema<Schemas> => ({ [name]: 'union', schemas })

export const fromSchema = <const S extends Schema>(schema: S): SchemaCodec<S, Encoded<S>, Decoded<S>> => ({ [name]: 'schema', schema })

export type Schema =
  | number | string | boolean | null | undefined
  | readonly Schema[]
  | { readonly [s: string]: Schema }
  | NamedSchema

export type NamedSchema =
  | NumberSchema | StringSchema | BooleanSchema
  | ArraySchema<unknown>
  | RecordSchema<string | StringSchema, unknown>
  | UnionSchema<readonly unknown[]>
  | Codec<any, any>

export const isNamedSchema = (x: unknown): x is NamedSchema => !!x && typeof (x as NamedSchema)[name] === 'string'

export type Decoded<S> =
  S extends number | string | boolean | null | undefined ? S
  : S extends NumberSchema ? number
  : S extends StringSchema ? string
  : S extends BooleanSchema ? boolean
  : S extends ArraySchema<infer Schema> ? readonly Decoded<Schema>[]
  : S extends RecordSchema<infer K extends PropertyKeySchema, infer V> ? Record<Decoded<K>, Decoded<V>>
  : S extends UnionSchema<infer Schemas> ? Decoded<Schemas[number]>
  : S extends RefineCodec<any, infer B> ? B // FIXME: Why does TS infer unknown without special casing this?
  : S extends Codec<any, infer B> ? B
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Decoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? { readonly [K in keyof S]: Decoded<S[K]> }
  : never

export type Encoded<S> =
  S extends number | string | boolean | null | undefined | NumberSchema | StringSchema | BooleanSchema ? unknown
  : S extends ArraySchema<unknown> ? readonly unknown[]
  : S extends RecordSchema<string, infer V> ? Record<string, Encoded<V>>
  : S extends UnionSchema<infer Schemas extends readonly Schema[]> ? Encoded<Schemas[number]>
  : S extends Codec<infer A, any> ? A
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Encoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? Record<string, Encoded<S[keyof S]>>
  : unknown
