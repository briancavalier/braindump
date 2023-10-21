import { Fail, Ok } from './result'

export const schema = Symbol.for('@braindump/codec/schema')

export interface Codec<in out A, in out B> {
  readonly _a?: A
  readonly _b?: B
}

export interface AnyNumber extends Codec<unknown, number> { readonly [schema]: 'number' }
export const number: AnyNumber = { [schema]: 'number' }

export interface AnyBigInt extends Codec<unknown, bigint> { readonly [schema]: 'bigint' }
export const bigint: AnyBigInt = { [schema]: 'bigint' }

export interface AnyString extends Codec<unknown, string> { readonly [schema]: 'string' }
export const string: AnyString = { [schema]: 'string' }

export interface AnyBoolean extends Codec<unknown, boolean> { readonly [schema]: 'boolean' }
export const boolean: AnyBoolean = { [schema]: 'boolean' }

export interface AnyObject extends Codec<unknown, Record<PropertyKey, unknown>> { readonly [schema]: 'object' }
export const object: AnyObject = ({ [schema]: 'object' })

export interface AnyArray extends Codec<unknown, readonly unknown[]> { readonly [schema]: 'array' }
export const array: AnyArray = ({ [schema]: 'array' })

export interface Union<Schemas extends readonly unknown[]> extends Codec<Encoded<Schemas[number]>, Decoded<Schemas[number]>> {
  readonly [schema]: 'union',
  readonly schemas: Schemas
}

export const union = <const Schemas extends readonly [Schema, Schema, ...readonly Schema[]]>(...schemas: Schemas): Union<Schemas> => ({ [schema]: 'union', schemas })

export interface EnumOf<Values extends Record<string, unknown>> extends Codec<unknown, Values[keyof Values]> {
  readonly [schema]: 'enum',
  readonly values: Values
}

export const enumOf = <const Values extends Record<string, string | number>>(values: Values): EnumOf<Values> => ({ [schema]: 'enum', values })

export interface ArrayOf<Schema> extends Codec<readonly Encoded<Schema>[], readonly Decoded<Schema>[]> {
  readonly [schema]: 'arrayOf',
  readonly items: Schema
}

export const arrayOf = <const S extends Schema>(items: S): ArrayOf<S> => ({ [schema]: 'arrayOf', items })

export interface RecordOf<K, V> extends Codec<Record<PropertyKey, unknown>, Record<Decoded<K> & PropertyKey, Decoded<V>>> {
  readonly [schema]: 'record',
  readonly keys: K,
  readonly values: V
}

export type PropertyKeySchema = string | AnyString | Codec<any, string>

export const propertyKey = union(string, number)

export const record = <K extends PropertyKeySchema, V>(keys: K, values: V): RecordOf<K, V> => ({ [schema]: 'record', keys, values })

export interface Refine<A, B extends A> extends Codec<A, B> {
  readonly [schema]: 'refine',
  readonly refine: (a: A) => a is B
}

export const refine = <A, B extends A>(refine: (a: A) => a is B): Refine<A, B> => ({ [schema]: 'refine', refine })

export interface Transform<A, B> extends Codec<A, B> {
  readonly [schema]: 'transform',
  readonly decode: (a: A) => Ok<B> | Fail,
  readonly encode: (b: B) => Ok<A> | Fail
}

export const codec = <A, B, R1 extends Ok<B> | Fail, R2 extends Ok<A> | Fail>(decode: (a: A) => R1, encode: (b: B) => R2): Transform<A, B> => ({ [schema]: 'transform', decode, encode })

export interface Lift<A, B> extends Codec<A, B> {
  readonly [schema]: 'lift',
  readonly schema: Schema
}

export const lift = <S extends AdhocSchema>(s: S): Lift<Encoded<S>, Decoded<S>> =>
  ({ [schema]: 'lift', schema: s })

export interface Pipe<A, B> extends Codec<A, B> {
  readonly [schema]: 'pipe',
  readonly codecs: readonly Codec<any, any>[]
}

export const pipe: {
  <A, B, C>(ab: Codec<A, B>, bz: Codec<B, C>): Pipe<A, C>,
  <A, B, C, D>(ab: Codec<A, B>, bc: Codec<B, C>, cd: Codec<C, D>): Pipe<A, D>,
  <A, B, C, D, E>(ab: Codec<A, B>, bc: Codec<B, C>, cd: Codec<C, D>, de: Codec<D, E>): Pipe<A, E>,
  <A, B, C, D, E, F>(ab: Codec<A, B>, bc: Codec<B, C>, cd: Codec<C, D>, de: Codec<D, E>, ef: Codec<E, F>): Pipe<A, F>,
} = (...codecs: readonly Codec<any, any>[]) => ({ [schema]: 'pipe', codecs }) as const

export const optionalSymbol = Symbol.for('@braindump/codec/optional')

export interface Optional<S> {
  readonly [optionalSymbol]: 'optional',
  readonly schema: S
}

export const optional = <S extends Schema>(schema: S): Optional<S> => ({ [optionalSymbol]: 'optional', schema })

export const isOptional = (s: unknown): s is Optional<unknown> => !!s && (s as Record<PropertyKey, unknown>)[optionalSymbol] === 'optional'

export const restSymbol = Symbol.for('@braindump/codec/rest')

export interface Rest<S> {
  readonly [restSymbol]: 'rest',
  readonly items: S
}

export const rest = <S extends Schema>(schema: S): Rest<S> => ({ [restSymbol]: 'rest', items: schema })

export const isRest = (s: unknown): s is Rest<unknown> => !!s && (s as Record<PropertyKey, unknown>)[restSymbol] === 'rest'

export const isNamed = <S>(s: S): s is S & StructuredSchema =>
  s && typeof (s as Record<PropertyKey, unknown>)[schema] === 'string'

export type Schema = StructuredSchema | AdhocSchema

type StructuredSchema =
  // Primitive
  | AnyNumber
  | AnyBigInt
  | AnyString
  | AnyBoolean
  | AnyObject
  | AnyArray
  // encum
  | EnumOf<Record<string, unknown>>
  // Sum
  | Union<readonly unknown[]>
  // Variable size product
  | RecordOf<unknown, unknown>
  | ArrayOf<unknown>
  // Transform
  | Refine<any, any>
  | Transform<any, any>
  | Lift<any, any>
  | Pipe<any, any>

type AdhocSchema =
  // Adhoc literal
  | number
  | bigint
  | string
  | boolean
  | null
  | undefined
  // Adhoc fixed size product
  | readonly Schema[]
  | readonly [...readonly unknown[], Rest<unknown>]
  | { readonly [s: string]: Schema | Optional<Schema> }

export type Decoded<S> =
  S extends number | bigint | string | boolean | null | undefined ? S
  : S extends Codec<any, infer A> ? A
  : S extends readonly Schema[] ? { readonly [K in keyof S]: Decoded<S[K]> }
  : S extends readonly [...infer A extends unknown[], Rest<infer B>] ? readonly [...{ readonly [K in keyof A]: Decoded<A[K]> }, ...readonly Decoded<B>[]]
  : S extends { readonly [s: PropertyKey]: Schema } ? { readonly [K in keyof S]: Decoded<S[K]> }
  : S extends { readonly [s: PropertyKey]: Schema | Optional<Schema> }
    ? { readonly [K in RequiredKeys<S>]: Decoded<S[K]> } &
    { readonly [K in OptionalKeys<S>]?: S[K] extends Optional<infer SS> ? Decoded<SS> : never }
  : never

export type Encoded<S> =
  S extends number | bigint | string | boolean | null | undefined ? unknown
  : S extends Codec<infer A, any> ? A
  : S extends readonly Schema[] ? readonly unknown[]
  : S extends readonly [...readonly Schema[], Rest<Schema>] ? readonly unknown[]
  : S extends { readonly [k: PropertyKey]: Schema | Optional<Schema> } ? { readonly [k: PropertyKey]: Encoded<S[keyof S]> }
  : never

type OptionalKeys<S> = {
  readonly [K in keyof S]: S[K] extends Optional<unknown> ? K : never
}[keyof S]

type RequiredKeys<S> = Exclude<keyof S, OptionalKeys<S>>
