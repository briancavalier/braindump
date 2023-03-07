export type AnySchema =
  | number | string | boolean | null | undefined
  | Schema<unknown>
  | { readonly [K in string]: AnySchema }
  | readonly AnySchema[]

export type Infer<S> =
  S extends number | string | boolean | null | undefined ? S
  : S extends Schema<infer A> ? A
  : S extends { readonly [K in string]: AnySchema } ? { readonly [K in keyof S]: Infer<S[K]> }
  : S extends readonly AnySchema[] ? { readonly [K in keyof S]: Infer<S[K]> }
  : unknown

const type = Symbol()
export const node = Symbol()

export interface Schema<T> {
  readonly [type]?: T,
  readonly [node]: SchemaNode
}

type SchemaNode =
  | { readonly name: 'unknown' | 'number' | 'string' | 'boolean' }
  | ArrayOf<AnySchema>
  | Union<readonly AnySchema[]>
  | Refine<any, any, unknown>

export const schema = <A>(a: Schema<A>[typeof node]): Schema<A> => ({ [node]: a })
export const isSchema = (x: unknown): x is Schema<unknown> => x != null && typeof x === 'object' && node in x

export const unknown = schema<unknown>({ name: 'unknown' })
export const number = schema<number>({ name: 'number' })
export const string = schema<string>({ name: 'string' })
export const boolean = schema<boolean>({ name: 'boolean' })

export type ArrayOf<S extends AnySchema> = {
  readonly name: 'array',
  readonly schema: S
}

export const array = <S extends AnySchema>(s: S) => schema<readonly Infer<S>[]>({
  name: 'array', schema: s
})

export type Union<Schemas> = {
  readonly name: 'union',
  readonly schemas: Schemas
}

export const union = <Schemas extends [AnySchema, AnySchema, ...readonly AnySchema[]]>(...ss: Schemas) => schema<Infer<Schemas[number]>>({
  name: 'union', schemas: ss
})

export type Refine<Schema, A, B extends A> = {
  readonly name: 'refine',
  readonly type: string,
  readonly schema: Schema,
  readonly ab: (a: A) => a is B
}

export const refine = <A extends Infer<S>, B extends A, S>(type: string, ab: (a: Infer<S>) => a is B, s: S) => schema<B>({
  name: 'refine', type, schema: s, ab
})
