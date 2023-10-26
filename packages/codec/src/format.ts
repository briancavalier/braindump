import { Fail } from './result'
import { Schema, Union, isNamed, isOptional, schema } from './schema'

export const formatSchema = (s: Schema, indent = '', pad = '  '): string => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean' || typeof s === 'bigint')
    return formatValue(s)

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number':
      case 'string':
      case 'boolean':
      case 'object':
      case 'array':
      case 'bigint':
        return ss
      case 'enum':
        return Object.values(s.values).map(v => `${v}`).join(' | ')
      case 'union':
        return s.schemas.map(s => formatSchema(s as Schema, indent, pad)).join(' | ')
      case 'record':
        return `Record<${formatSchema(s.keys as Schema, indent, pad), formatSchema(s.values as Schema, indent, pad)}>`
      case 'arrayOf':
        return `readonly ${formatSchema(s.items as Schema, indent, pad)}[]`
      case 'refine':
      case 'transform':
        return ss
      case 'lift':
        return formatSchema(s.schema, indent, pad)
      case 'pipe':
        return formatSchema(s.codecs[0] as Schema, indent, pad)
    }
  }

  if (Array.isArray(s)) {
    return `[${s.map(s => formatSchema(s, indent, pad)).join(', ')}]`
  } else if (s && typeof s === 'object') {
    return `{${Object.keys(s).reduce(
      (r, k) => {
        const sk = (s as any)[k]
        const opt = isOptional(sk)
        return r + `\n${indent + pad}${k}${opt ? '?' : ''}: ${formatSchema(opt ? sk.schema : sk, indent + pad, pad)}`
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
      return wrap(r.input, `${r.errors.map(e => `${formatFail(e as Fail, indent + pad, pad)}`).join(`\n`)}`, indent)
    case 'failed':
      return `${r.message}: expected ${formatSchema(r.schema as any, indent, pad)}`
    case 'thrown':
      return `got ${formatValue(r.input)}, which threw: ${r.error instanceof Error
        ? r.error.stack
          ? formatStack(r.error.stack, indent)
          : r.error.message
        : `${r.error}`}`
  }
}

export const formatValue = (x: unknown): string =>
  x === null ? 'null'
    : x === undefined ? 'undefined'
      : typeof x === 'bigint' ? `${x}n`
        : typeof x === 'number' || typeof x === 'boolean' ? `${x}`
          : typeof x === 'string' ? `"${x}"`
            : Array.isArray(x) ? `[${x.length > 3 ? `${x.slice(0, 3)}...` : x}]`
              : JSON.stringify(x)

export const formatStack = (s: string, indent: string) =>
  s.split('\n').map(s => `${indent}${s}`).join('\n')

const formatSimpleUnion = (input: unknown, s: Schema, indent: string, pad: string) =>
  `got ${formatSchema(input as any)}, expected ${formatSchema(s, indent, pad)}`

const formatUnion = (errors: readonly unknown[], indent: string, pad: string) =>
  `No union schemas matched:${errors.map((e, i) => `\n---schema ${i}${indent}----------\n${indent}${formatFail(e as Fail, indent, pad)}`).join('')}`

const isSimpleUnion = (s: Union<readonly unknown[]>) =>
  s.schemas.every(s => (isNamed(s) || isAdhocPrimitive(s)))

const isAdhocPrimitive = (x: unknown): x is number | string | boolean | null | undefined =>
  x == null || typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean'
