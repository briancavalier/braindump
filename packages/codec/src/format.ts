import { Fail } from './result'
import { Schema, isNamed, isOptional, schema } from './schema'

export const formatSchema = (s: Schema, indent = '', pad = '  '): string => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return formatValue(s)

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number':
      case 'string':
      case 'boolean':
      case 'object':
      case 'array':
        return ss
      case 'union':
        return s.schemas.map(s => formatSchema(s as Schema, indent)).join(' | ')
      case 'record':
        return `Record<${formatSchema(s.keys as Schema, indent), formatSchema(s.values as Schema, indent)}>`
      case 'arrayOf':
        return `readonly ${formatSchema(s.items as Schema)}[]`
      case 'refine':
      case 'transform':
        return ss
      case 'lift':
        return formatSchema(s.schema, indent)
      case 'pipe':
        return formatSchema(s.codecs[0] as Schema, indent)
    }
  }

  if (Array.isArray(s)) {
    return `[${s.map(s => formatSchema(s, indent)).join(', ')}]`
  } else if (s && typeof s === 'object') {
    return `{${Object.keys(s).reduce(
      (r, k) => {
        const sk = (s as any)[k]
        const opt = isOptional(sk)
        return r + `\n${indent + pad}${k}${opt ? '?' : ''}: ${formatSchema(opt ? sk.schema : sk, indent + pad)}`
      }, '')
      }\n${indent}}`
  }

  return JSON.stringify(s, null, ' ')
}

export const formatValue = (x: unknown): string =>
  x === null ? 'null'
    : x === undefined ? 'undefined'
      : typeof x === 'string' ? `"${x}"`
        : Array.isArray(x) ? `[${x.length > 3 ? `${x.slice(0, 3)}...` : x}]`
          : JSON.stringify(x)

export const formatFail = (r: Fail, indent = '', pad = '  '): string => {
  switch (r.type) {
    case 'unexpected':
      return `got ${formatValue(r.input)}, expected ${formatSchema(r.schema as any)}`
    case 'missing':
      return `${indent}${r.key}: [MISSING] expected ${formatSchema(r.schema as any, indent)}`
    case 'at':
      return `${indent}${r.key}: ${formatFail(r.error as Fail, indent, pad)}`
    case 'none':
      return `got ${formatValue(r.input)}, expected ${formatSchema(r.schema as any, indent + pad, pad)}`//${r.errors.map(e => `\n${indent + pad}| ${renderFail(e as Fail, indent + pad, pad)}`)}`
    case 'all': {
      const [start, end] = Array.isArray(r.input) ? ['[', ']'] : ['{', '}']
      return `${start}${r.errors.map(e => `\n${formatFail(e as Fail, indent + pad, pad)}`)}\n${indent}${end}`
    }
    case 'thrown':
      return r.error instanceof Error ? r.error.stack ?? r.error.message : `${r.error}`
  }
}
