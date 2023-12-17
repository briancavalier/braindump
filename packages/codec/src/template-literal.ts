
import { Fail, Ok, isOk, ok, unexpected } from './result'
import { Schema, TemplateLiteral, TemplateLiteralComponentSchema, isTemplateLiteral, schema } from './schema'

export const join = <S>(handleSchema: (s: Schema, x: string) => Ok<string> | Fail, t: TemplateLiteral<S>, groups: readonly string[], original: string) => {
  let result = ''
  for (let i = 0; i < t.schemas.length; i++) {
    const r = joinSchema(handleSchema, t.schemas[i], groups[i], original)
    if(isOk(r)) result += r.value
    else return r
  }

  return ok(result)
}

const joinSchema = (handleSchema: (s: Schema, x: string) => Ok<string> | Fail, s: TemplateLiteralComponentSchema, group: string, original: string): Ok<string> | Fail => {
  if (typeof s === 'string' || typeof s === 'number' || typeof s === 'bigint' || typeof s === 'boolean') {
    return ok(`${s}`)
  } else {
    switch (s[schema]) {
      case 'string':
      case 'number':
      case 'bigint':
      case 'int':
      case 'float':
      case 'boolean':
      case 'template-literal':
        return ok(group)
      case 'union': {
        for (const ss of s.schemas) {
          const r = joinSchema(handleSchema, ss, group, original)
          if(isOk(r)) return r
        }
        return unexpected(s, original)
      }
      case 'transform':
        return handleSchema(s, group)
    }
  }
}

export function regexFor(t: TemplateLiteral<string>): string
export function regexFor(t: Schema): undefined
export function regexFor(t: Schema): string | undefined {
  return isTemplateLiteral(t) ? `^${buildRegex(t)}$` : undefined
}

export const buildRegex = (t: TemplateLiteral<string>) => {
  let rx = ''
  for (const s of t.schemas) rx += regexForSchema(s)
  return rx
}

const regexForSchema = (s: TemplateLiteralComponentSchema): string => {
  if (typeof s === 'string' || typeof s === 'number' || typeof s === 'bigint' || typeof s === 'boolean') {
    return String.raw`(${s})`
  } else {
    switch (s[schema]) {
      case 'string': return '(.*)'
      case 'number': return numberRx
      case 'bigint':
      case 'int': return String.raw`([+-]?\d+)`
      case 'float': return floatRx
      case 'boolean': return '(true|false)'
      case 'template-literal': return buildRegex(s as any)
      case 'union': return `(${s.schemas.map(s => regexForSchema(s as any)).join('|')})`
      case 'transform': return '(.*)'
    }
  }
}

const numberRx = String.raw`([-+]?(?:(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|Infinity|NaN))`
const floatRx = String.raw`([-+]?(?:(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?))`
