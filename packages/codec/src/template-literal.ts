
import { Fail, Ok, isOk, ok, unexpected } from './result'
import { Schema, TemplateLiteral, TemplateLiteralComponentSchema, schema } from './schema'

export const join = <S>(handleSchema: (s: Schema, x: string) => Ok<string> | Fail, t: TemplateLiteral<readonly TemplateLiteralComponentSchema[], S>, groups: readonly string[], original: string) => {
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

export const regexFor = <S>(t: TemplateLiteral<readonly TemplateLiteralComponentSchema[], S>) => {
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
      case 'bigint': return String.raw`([+-]?\d+)`
      case 'boolean': return '(true|false)'
      case 'template-literal': return regexFor(s)
      case 'union': return `(${s.schemas.map(s => regexForSchema(s as any)).join('|')})`
      case 'transform': return '(.*)'
    }
  }
}

const numberRx = String.raw`([-+]?(?:(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|Infinity|NaN))`
