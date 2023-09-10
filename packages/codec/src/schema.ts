import { Codec, RefineCodec, SchemaCodec, name } from './codec'

export interface NumberSchema { readonly [name]: 'number' }
export const number: NumberSchema = { [name]: 'number' }

export interface StringSchema { readonly [name]: 'string' }
export const string: StringSchema = { [name]: 'string' }

export interface BooleanSchema { readonly [name]: 'boolean' }
export const boolean: BooleanSchema = { [name]: 'boolean' }

export interface ArraySchema<Schema> {
  readonly [name]: 'array',
  readonly itemSchema: Schema
}

export const array = <const Schema>(itemSchema: Schema): ArraySchema<Schema> => ({ [name]: 'array', itemSchema })

export interface UnionSchema<Schemas extends readonly unknown[]> {
  readonly [name]: 'union',
  readonly schemas: Schemas
}

export const union = <const Schemas extends readonly [unknown, unknown, ...readonly unknown[]]>(...schemas: Schemas): UnionSchema<Schemas> => ({ [name]: 'union', schemas })

export const fromSchema = <const S extends Schema>(schema: S): SchemaCodec<S, Encoded<S>, Decoded<S>> => ({ [name]: 'schema', schema })

export type Schema =
  | number | string | boolean | null | undefined
  | readonly Schema[]
  | { readonly [s: string]: Schema }
  | NamedSchema

export type NamedSchema =
  | typeof number | typeof string | typeof boolean
  | ArraySchema<unknown>
  | UnionSchema<readonly unknown[]>
  | Codec<any, any>

export const isNamedSchema = (x: unknown): x is NamedSchema => !!x && typeof (x as NamedSchema)[name] === 'string'

export type Decoded<S> =
  S extends number | string | boolean | null | undefined ? S
  : S extends NumberSchema ? number
  : S extends StringSchema ? string
  : S extends BooleanSchema ? boolean
  : S extends ArraySchema<infer Schema> ? readonly Decoded<Schema>[]
  : S extends UnionSchema<infer Schemas extends readonly unknown[]> ? Decoded<Schemas[number]>
  : S extends RefineCodec<any, infer B> ? B
  : S extends Codec<any, infer B> ? B
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Decoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? { readonly [K in keyof S]: Decoded<S[K]> }
  : never

export type Encoded<S> =
  S extends number | string | boolean | null | undefined | NumberSchema | StringSchema | BooleanSchema ? unknown
  : S extends ArraySchema<unknown> ? readonly unknown[]
  : S extends UnionSchema<infer Schemas extends readonly Schema[]> ? Encoded<Schemas[number]>
  : S extends Codec<infer A, any> ? A
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Encoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? { readonly [K in keyof S as string]: Encoded<S[K]> }
  : unknown
