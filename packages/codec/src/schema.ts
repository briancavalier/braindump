import { Fail, Ok } from './result'

export const name = '@braindump/codec/name' as const

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

export interface PipeSchema<Schemas> {
  readonly [name]: 'pipe',
  readonly schemas: Schemas
}

type Mapping<A, B> =
  | RefineSchema<A, A & B>
  | MapSchema<A, B>
  | Codec<A, B>

export function pipe<S0, S1 extends Mapping<Decoded<S0>, any>>(...schemas: readonly [S0, S1]): PipeSchema<typeof schemas>
export function pipe<S0, S1 extends Mapping<Decoded<S0>, any>, S2 extends Mapping<Decoded<S1>, any>>(s0: S0, s1: S1, s2: S2): PipeSchema<readonly [S0, S1, S2]>
export function pipe(...schemas: readonly unknown[]) {
  return { [name]: 'pipe', schemas }
}

export interface RefineSchema<A, B extends A> {
  readonly [name]: 'refine',
  readonly refine: (a: A) => a is B
}

export const refine = <A, B extends A>(refine: (a: A) => a is B): RefineSchema<A, B> => ({ [name]: 'refine', refine })

export interface MapSchema<A, B> {
  readonly [name]: 'map',
  readonly ab: (a: A) => B,
  readonly ba: (b: B) => A
}

export const map = <A, B>(ab: (a: A) => B, ba: (b: B) => A): MapSchema<A, B> => ({ [name]: 'map', ab, ba })

export interface Codec<A, B> {
  readonly [name]: 'codec',
  readonly decode: (a: A) => Ok<B> | Fail,
  readonly encode: (b: B) => Ok<A> | Fail
}

export const codec = <A, B>(ab: (a: A) => Ok<B> | Fail, ba: (b: B) => Ok<A> | Fail): Codec<A, B> => ({ [name]: 'codec', decode: ab, encode: ba })

export type Schema =
  | number | string | boolean | null | undefined
  | readonly Schema[]
  | { readonly [s: string]: Schema }
  | NamedSchema

export type NamedSchema =
  | typeof number | typeof string | typeof boolean
  | ArraySchema<unknown>
  | UnionSchema<readonly unknown[]>
  | PipeSchema<readonly unknown[]>
  | RefineSchema<any, unknown>
  | MapSchema<any, any>
  | Codec<any, any>

export const isNamedSchema = (x: unknown): x is NamedSchema => !!x && typeof (x as NamedSchema)[name] === 'string'

export type Decoded<S> =
  S extends number | string | boolean | null | undefined ? S
  : S extends NumberSchema ? number
  : S extends StringSchema ? string
  : S extends BooleanSchema ? boolean
  : S extends ArraySchema<infer Schema> ? readonly Decoded<Schema>[]
  : S extends UnionSchema<infer Schemas extends readonly unknown[]> ? Decoded<Schemas[number]>
  : S extends RefineSchema<unknown, infer B> ? B
  : S extends MapSchema<any, infer B> ? B
  : S extends Codec<any, infer B> ? B
  : S extends PipeSchema<readonly [...readonly unknown[], infer S2]> ? Decoded<S2>
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Decoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? { readonly [K in keyof S]: Decoded<S[K]> }
  : never

export type Encoded<S> =
  S extends number | string | boolean | null | undefined | NumberSchema | StringSchema | BooleanSchema ? unknown
  : S extends ArraySchema<unknown> ? readonly unknown[]
  : S extends UnionSchema<infer Schemas extends readonly Schema[]> ? Encoded<Schemas[number]>
  : S extends RefineSchema<infer A, any> ? A
  : S extends MapSchema<infer A, any> ? A
  : S extends Codec<infer A, any> ? A
  : S extends PipeSchema<readonly [infer S1, ...readonly unknown[]]> ? Encoded<S1>
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Encoded<S[K]> }
  : S extends { readonly [s: string]: Schema } ? { readonly [K in keyof S as string]: Encoded<S[K]> }
  : unknown
