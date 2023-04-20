import type Ajv from 'ajv/dist/jtd'
import { JTDParser } from 'ajv/dist/jtd'

import { Parser } from './parser'
import { Parsed, Schema } from './schema'

export type AjvJTDError = {
  readonly position?: number | undefined,
  readonly message?: string | undefined,
  readonly input: string
}

export type AjvJTDCompiler = Pick<Ajv, 'compileParser' | 'compileSerializer'>

export const parser: <S extends Schema>(a: AjvJTDCompiler, s: S) => Parser<string, Parsed<S>, AjvJTDError > = <S extends Schema>(a: AjvJTDCompiler, s: S): Parser<string, Parsed<S>, AjvJTDError> => {
  // Memoized compiled parsers
  let p: JTDParser<Parsed<S>>
  let u: <P extends Parsed<S>>(o: P) => string
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
