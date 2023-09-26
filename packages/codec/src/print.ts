import { Fail } from './result'
import { Schema, isNamed, schema } from './schema'

export const printSchema = (s: Schema, indent = '', pad = '  '): string => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return printValue(s)

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
        return s.schemas.map(s => printSchema(s as Schema, indent)).join(' | ')
      case 'record':
        return `Record<${printSchema(s.keys as Schema, indent), printSchema(s.values as Schema, indent)}>`
      case 'arrayOf':
        return `readonly ${printSchema(s.items as Schema)}[]`
      case 'refine':
      case 'total':
      case 'part':
        return ss
      case 'lift':
        return printSchema(s.schema, indent)
      case 'pipe':
        return printSchema(s.codecs[0] as Schema, indent)
    }
  }

  if (Array.isArray(s)) {
    return `[${s.map(s => printSchema(s, indent)).join(', ')}]`
  } else if (s && typeof s === 'object') {
    return `{${Object.keys(s).reduce(
      (r, k) => r + `\n${indent + pad}${k}: ${printSchema((s as any)[k], indent + pad)}`, '')
      }\n${indent}}`
  }

  return JSON.stringify(s, null, ' ')
}

export const printValue = (x: unknown): string =>
  x === null ? 'null'
    : x === undefined ? 'undefined'
      : typeof x === 'string' ? `"${x}"`
        : Array.isArray(x) ? `[${x.length > 3 ? `${x.slice(0, 3)}...` : x}]`
          : JSON.stringify(x)

export const printFail = (r: Fail, indent = '', pad = '  '): string => {
  switch (r.type) {
    case 'unexpected':
      return `got ${printValue(r.input)}, expected ${printSchema(r.schema as any)}`
    case 'missing':
      return `${indent}${r.key}: [MISSING] expected ${printSchema(r.schema as any, indent)}`
    case 'at':
      return `${indent}${r.key}: ${printFail(r.error as Fail, indent, pad)}`
    case 'none':
      return `got ${printValue(r.input)}, expected ${printSchema(r.schema as any, indent + pad, pad)}`//${r.errors.map(e => `\n${indent + pad}| ${renderFail(e as Fail, indent + pad, pad)}`)}`
    case 'all': {
      const [start, end] = Array.isArray(r.input) ? ['[', ']'] : ['{', '}']
      return `${start}${r.errors.map(e => `\n${printFail(e as Fail, indent + pad, pad)}`)}\n${indent}${end}`
    }
    case 'thrown':
      return r.error instanceof Error ? r.error.stack ?? r.error.message : `${r.error}`
  }
}
