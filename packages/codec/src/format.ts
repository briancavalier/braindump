import { Fail } from './result'
import { Schema, Union, isNamed, isOptional, schema } from './schema'

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

  return JSON.stringify(s, null, pad)
}

const wrap = (input: unknown, s: string, indent: string) => {
  const [start, end] = Array.isArray(input) ? ['[', ']'] : ['{', '}']
  return `${start}\n${s}\n${indent}${end}`
}

export const formatFail = (r: Fail, indent = '', pad = '  '): string => {
  switch (r.type) {
    case 'unexpected':
      return `got ${formatValue(r.input)}, expected ${formatSchema(r.schema as any, indent, pad)}`
    case 'missing':
      return `${indent}${r.key}: [MISSING] expected ${formatSchema(r.schema as any, indent, pad)}`
    case 'at':
      return `${indent}${r.key}: ${formatFail(r.error as Fail, indent, pad)}`
    case 'stopped':
      return wrap(r.input, `${formatFail(r.error as Fail, indent + pad, pad)}\n${indent + pad}... (stopped after first error) ...`, indent)
    case 'none': {
      const s = r.schema
      if (isNamed(s) && s[schema] === 'union')
        return isSimpleUnion(s)
          ? formatSimpleUnion(r.input, r.schema as Schema, indent + pad, pad)
          : formatUnion(r.errors, indent + pad, pad)
      return formatSimpleUnion(r.input, r.schema as Schema, indent + pad, pad)
    }
    case 'all':
      return wrap(r.input, `${r.errors.map(e => `\n${formatFail(e as Fail, indent + pad, pad)}`)}`, indent)
    case 'thrown':
      return r.error instanceof Error ? r.error.stack ?? r.error.message : `${r.error}`
  }
}

export const formatValue = (x: unknown): string =>
  x === null ? 'null'
    : x === undefined ? 'undefined'
      : typeof x === 'string' ? `"${x}"`
        : Array.isArray(x) ? `[${x.length > 3 ? `${x.slice(0, 3)}...` : x}]`
          : JSON.stringify(x)

const formatSimpleUnion = (input: unknown, s: Schema, indent: string, pad: string) =>
  `got ${formatSchema(input as any)}, expected ${formatSchema(s, indent + pad, pad)}`

const formatUnion = (errors: readonly unknown[], indent: string, pad: string) =>
  `No union schemas matched:${errors.map((e, i) => `\n---schema ${i}${indent}----------\n${indent}${formatFail(e as Fail, indent, pad)}`).join('')}`
    // `got ${formatSchema(input as any)}, but no schemas matched:${errors.map((e, i) => `\n${indent}----------\n${indent}schema ${i}:\n${indent + pad}${formatSchema(schemas[i] as any, indent + pad, pad)}\n${indent}failed:\n${indent + pad}${formatFail(e as Fail, indent + pad, pad)}`).join('')}`

const isSimpleUnion = (s: Union<readonly unknown[]>) =>
  s.schemas.every(s => (isNamed(s) || isAdhocPrimitive(s)))

const isAdhocPrimitive = (x: unknown): x is number | string | boolean | null | undefined =>
  x == null || typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean'
