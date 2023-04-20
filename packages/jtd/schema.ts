export type Schema =
  Empty & (Empty | Int | Float | Str | Bool | Timestamp | Enum | Elements | Properties | Discriminator | Values | Ref)

export type Parsed<S> =
  ParsedNullable<S, S extends {
    readonly definitions: Record<string, Schema>
  } ? S['definitions'] : Record<never, never>>

type ParsedNullable<S, Definitions extends Record<string, unknown>> =
  S extends { readonly nullable: true } ? InferParsed<S, Definitions> | null : InferParsed<S, Definitions>

type InferParsed<S, Definitions extends Record<string, unknown>> =
  S extends Int | Float ? number
  : S extends Str ? string
  : S extends Bool ? boolean
  : S extends Timestamp ? string
  : S extends Enum ? S['enum'][number]
  : S extends Elements ? readonly ParsedNullable<S['elements'], Definitions>[]
  : S extends Properties ?
    (keyof S['properties'] & keyof S['optionalProperties']) extends never ?
      ({ [K in keyof S['properties']]: ParsedNullable<S['properties'][K], Definitions> }
      & (S extends { readonly optionalProperties: infer O } ? { [K in keyof O]?: ParsedNullable<O[K], Definitions> } : unknown)
      & (S extends { readonly additionalProperties: true } ? { [k: string]: unknown } : unknown))
    : OverlappingKeysError<S>
  : S extends Discriminator ?
    S['discriminator'] extends PropertiesKeys<S['mapping'][keyof S['mapping']]>
      ? DiscrimatorPropertyNotAllowedError<S['discriminator']>
      : {
        [K in keyof S['mapping']]: ParsedNullable<S['mapping'][K], Definitions> & { readonly [D in S['discriminator']]: K }
      }[keyof S['mapping']]
  : S extends Values ? { [s: string]: ParsedNullable<S['values'], Definitions> }
  : S extends Ref ?
    S['ref'] extends keyof Definitions
      ? ParsedNullable<Definitions[S['ref']], Definitions>
      : MissingDefinitionError<S['ref']>
  : S extends Empty ? number | string | boolean | readonly unknown[] | Record<string, unknown>
  : never

type Int = { readonly type: 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' }
type Float = { readonly type: 'float32' | 'float64' }
type Str = { readonly type: 'string' }
type Bool = { readonly type: 'boolean' }
type Timestamp = { readonly type: 'timestamp' }

type Enum = { readonly enum: readonly string[] }

type Elements = { readonly elements: Schema }

type Properties = {
  readonly properties: { readonly [P in string]: Schema },
  readonly optionalProperties?: { readonly [P in string]: Schema },
  readonly additionalProperties?: boolean
}

type PropertiesKeys<S> = S extends Properties ? keyof S['properties'] | keyof S['optionalProperties'] : never

type Discriminator = {
  readonly discriminator: string,
  readonly mapping: Record<string, Properties>
}

type Values = { readonly values: Schema }

type Empty = {
  readonly nullable?: boolean,
  readonly metadata?: unknown
}

type Ref = { readonly ref: string }

// Schema type inference Errors
export type OverlappingKeysError<S extends Properties> = {
  error: 'properties and optionalProperties keys cannot overlap',
  keys: keyof S['properties'] & keyof S['optionalProperties']
}

export type MissingDefinitionError<Ref> = {
  error: 'ref missing from definitions',
  ref: Ref
}

export type DiscrimatorPropertyNotAllowedError<Discriminator> = {
  error: 'discriminator property cannot be used in mappings',
  discriminator: Discriminator
}
