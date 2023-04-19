import Ajv, { JTDParser } from 'ajv/dist/jtd'

import { Parsed, Schema } from './schema'

export interface Parser<Unparsed, Parsed, E = unknown> {
  parse: (input: Unparsed) => Result<Parsed, E>
  unparse: <P extends Parsed>(x: P) => Unparsed
}

export type Result<A, E> =
  | Readonly<{ ok: true, value: A }>
  | Readonly<{ ok: false, error: E }>

type AjvJTDError = {
  readonly position?: number | undefined,
  readonly message?: string | undefined,
  readonly input: string
}

export const parser: <S extends Schema>(a: Ajv, s: S) => Parser<string, Parsed<S>, AjvJTDError > = <S extends Schema>(a: Ajv, s: S): Parser<string, Parsed<S>, AjvJTDError> => {
  // Memoized compiled parsers
  let p: JTDParser<Parsed<S>>
  let u: (o: Parsed<S>) => string
  return {
    parse: unparsed => {
      const result = (p ?? (p = a.compileParser(s)))(unparsed)
      return result === undefined
        ? { ok: false, error: { position: p.position, message: p.message, input: unparsed } } as const
        : { ok: true, value: result } as const
    },
    unparse: parsed => (u ?? (u = a.compileSerializer(s)))(parsed)
  }
}
