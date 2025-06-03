import type Ajv from 'ajv/dist/jtd'
import type { JTDParser } from 'ajv/dist/jtd'
import { Schema as JTDSchema, Parsed } from "./schema"

export type Result<A> =
  | Readonly<{ ok: true, value: A }>
  | Readonly<{ ok: false, position: number | undefined, message: string | undefined, input: string }>

export interface Parser<Schema> {
  parse: <const S extends Schema>(s: S, input: string) => Result<Parsed<S>>
  serialize: <const S extends Schema, A extends Parsed<S>>(s: S, a: A) => string
}

export type AjvJTD = Pick<Ajv, 'compileParser' | 'compileSerializer'>

const parsers = new WeakMap<JTDSchema, JTDParser<Parsed<JTDSchema>>>()
const serializers = new WeakMap<JTDSchema, (a: Parsed<JTDSchema>) => string>()

export class AjvParser<Schema extends JTDSchema = JTDSchema> implements Parser<Schema> {
  constructor(private readonly ajv: AjvJTD) { }

  parse<const S extends Schema>(s: S, input: string): Result<Parsed<S>> {
    let parser = parsers.get(s)
    if (!parser) {
      parser = this.ajv.compileParser(s)
      parsers.set(s, parser)
    }
    const result = parser(input) as Parsed<S> | undefined
    return result === undefined
      ? { ok: false, position: parser.position, message: parser.message, input: input }
      : { ok: true, value: result }
  }

  serialize<const S extends Schema, A extends Parsed<S>>(s: S, a: A): string {
    let serializer = serializers.get(s)
    if (!serializer) {
      serializer = this.ajv.compileSerializer(s)
      serializers.set(s, serializer)
    }
    return serializer(a as Parsed<JTDSchema>)
  }
}

