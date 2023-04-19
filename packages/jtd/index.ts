import Ajv, { JTDParser } from 'ajv/dist/jtd'

export type Schema =
  Empty & (Int | Float | Str | Bool | Timestamp | Enum | Elements | Properties | Discriminator | Values | Ref)

export type Parsed<S> =
  ParsedNullable<S, S extends {
    readonly definitions: Record<string, Schema>
  } ? S['definitions'] : Record<string, never>>

export type Result<A> =
  | Readonly<{ ok: true, value: A }>
  | Readonly<{ ok: false, input: string, position?: number | undefined, message?: string | undefined }>

export interface Parser<In, Out> {
  parse: (input: In) => Result<Out>
  unparse: (x: Out) => In
}

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
  : S extends Empty ? number | string | boolean | Date | readonly unknown[] | Record<string, unknown>
  : never

type Int = { readonly type: 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' }
type Float = { readonly type: 'float32' | 'float64' }
type Str = { readonly type: 'string' }
type Bool = { readonly type: 'boolean' }
type Timestamp = { readonly type: 'timestamp' }

type Enum = { readonly enum: readonly string[] }

type Elements = { readonly elements: Schema }

type Properties = {
  readonly properties: { [P in string]: Schema },
  readonly optionalProperties?: { [P in string]: Schema },
  readonly additionalProperties?: boolean
}

type Discriminator = {
  readonly discriminator: string,
  readonly mapping: Record<string, Schema>
}

type Values = { readonly values: Schema }

type Empty = {
  readonly nullable?: boolean,
  readonly metadata?: unknown
}

type Ref = { readonly ref: string }

export const parser = <S extends Schema>(a: Ajv, s: S): Parser<string, Parsed<Schema>> => {
  // Memoized compiled parsers
  let p: JTDParser<Parsed<Schema>>
  let u: (o: Parsed<Schema>) => string
  return {
    parse: input => {
      const result = (p ?? (p = a.compileParser(s)))(input)
      return result === undefined
        ? { ok: false, position: p.position, message: p.message, input }
        : { ok: true, value: result }
    },
    unparse: x => (u ?? (u = a.compileSerializer(s)))(x)
  }
}
