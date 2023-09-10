import { Fail, Ok } from './result'

export const name = Symbol.for('@braindump/codec/name')

export type Codec<A, B> =
  | RefineCodec<A, B & A>
  | TotalCodec<A, B>
  | PartialCodec<A, B>
  | SchemaCodec<unknown, A, B>
  | PipeCodec<A, B>

export interface RefineCodec<A, B extends A> {
  readonly [name]: 'refine',
  readonly refine: (a: A) => a is B
}

export const refine = <A, B extends A>(refine: (a: A) => a is B): RefineCodec<A, B> => ({ [name]: 'refine', refine })

export interface TotalCodec<A, B> {
  readonly [name]: 'map',
  readonly ab: (a: A) => B,
  readonly ba: (b: B) => A
}

export const map = <A, B>(ab: (a: A) => B, ba: (b: B) => A): TotalCodec<A, B> => ({ [name]: 'map', ab, ba })

export interface PartialCodec<A, B> {
  readonly [name]: 'codec',
  readonly decode: (a: A) => Ok<B> | Fail,
  readonly encode: (b: B) => Ok<A> | Fail
}

export const codec = <A, B>(ab: (a: A) => Ok<B> | Fail, ba: (b: B) => Ok<A> | Fail): PartialCodec<A, B> => ({ [name]: 'codec', decode: ab, encode: ba })

export interface SchemaCodec<S, in out A, in out B> {
  readonly [name]: 'schema',
  readonly _a?: A,
  readonly _b?: B,
  readonly schema: S
}

export interface PipeCodec<in out A, in out B> {
  readonly [name]: 'pipe',
  readonly codecs: readonly [Codec<A, any>, ...readonly Codec<any, any>[], Codec<any, B>]
}

export const pipe: {
  <A, B, Z>(ab: Codec<A, B>, bz: Codec<B, Z>): PipeCodec<A, Z>,
  <A, B, C, Z>(ab: Codec<A, B>, bc: Codec<B, C>, cz: Codec<C, Z>): PipeCodec<A, Z>,
  <A, B, C, D, Z>(ab: Codec<A, B>, bc: Codec<B, C>, cd: Codec<C, D>, dz: Codec<D, Z>): PipeCodec<A, Z>,
} = (...codecs: any) => ({ [name]: 'pipe', codecs }) as const
