export type Schema =
  Empty & (Empty | Int | Float | Str | Bool | Timestamp | Enum | Elements | Properties | Discriminator | Values | Ref)

export type Parsed<S> =
  ParsedNullable<S, S extends {
    readonly definitions: Record<string, Schema>
  } ? S['definitions'] : Record<string, never>>

type ParsedNullable<S, Definitions extends Record<string, unknown>> =
  S extends { readonly nullable: true } ? (InferParsed<S, Definitions> | null) : InferParsed<S, Definitions>

type InferParsed<S, Definitions extends Record<string, unknown>> =
  S extends Int | Float ? number
  : S extends Str ? string
  : S extends Bool ? boolean
  : S extends Timestamp ? string
  : S extends Enum ? S['enum'][number]
  : S extends Elements ? readonly (ParsedNullable<S['elements'], Definitions>)[]
  : S extends Properties ? { [K in keyof S['properties']]: ParsedNullable<S['properties'][K], Definitions> }
  & (S extends { readonly optionalProperties: unknown } ? { [K in keyof S['optionalProperties']]?: ParsedNullable<S['optionalProperties'][K], Definitions> } : unknown)
  & (S extends { readonly additionalProperties: true } ? { [s: string]: unknown } : unknown)
  : S extends Discriminator ? S['discriminator'] extends keyof S['mapping'] ? never
  : (Record<S['discriminator'], keyof S['mapping']>
    & {
      [K in keyof S['mapping']]: ParsedNullable<S['mapping'][K], Definitions> & { [D in S['discriminator']]: K }
    })[keyof S['mapping']]
  : S extends Values ? { [s: string]: ParsedNullable<S['values'], Definitions> }
  : S extends Ref ? ParsedNullable<Definitions[S['ref']], Definitions>
  : S extends Empty ? number | string | boolean | readonly unknown[] | Record<string, unknown>
  : never

type Int = { readonly type: 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' }
type Float = { readonly type: 'float32' | 'float64' }
type Str = { readonly type: 'string' }
type Bool = { readonly type: 'boolean' }
type Timestamp = { readonly type: 'timestamp' }

type Enum = { readonly enum: readonly string[] }

type Elements = { readonly elements: Schema }

export type Properties = {
  readonly properties: { readonly [P in string]: Schema },
  readonly optionalProperties?: { readonly [P in string]: Schema },
  readonly additionalProperties?: boolean
}

type Discriminator = {
  readonly discriminator: string,
  readonly mapping: Record<string, Schema>
}

type Values = { readonly values: Schema }

export type Empty = {
  readonly nullable?: boolean,
  readonly metadata?: unknown
}

type Ref = { readonly ref: string }
