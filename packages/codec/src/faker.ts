import { inspect } from 'node:util'

import { simpleFaker as F } from '@faker-js/faker'

import { Decoded, Schema, isNamed, isOptional, schema } from './schema'

export const example = <const S extends Schema>(s: S): Decoded<S> => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return s as any

  if (Array.isArray(s))
    return s.map(example) as any

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number': return F.number.float({ min: -1000, max: 1000 }) as any
      case 'string': return F.string.alphanumeric({ length: { min: 0, max: 20 } }) as any
      case 'boolean': return F.datatype.boolean() as any
      case 'object': return {} as any
      case 'array': return [] as any
      case 'enum': return F.helpers.objectValue(s.values) as any
      case 'union': return example(F.helpers.arrayElement(s.schemas) as any)
      case 'record': return Object.fromEntries(
        Array.from({ length: F.number.int({ max: 100 }) }, () => [example(s.keys as any), example(s.values as any)])
      ) as any
      case 'arrayOf': return Array.from({ length: F.number.int({ max: 100 }) }, () => example(s.items as any)) as any
      case 'lift': return example(s.schema as any)
      default:
        throw new Error(`Example values not supported for ${ss}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: unknown }
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]
      if (isOptional(sk)) {
        if (F.datatype.boolean()) a[k] = example(sk.schema as any)
      } else a[k] = example(sk)
    }
    return a as any
  }

  throw new Error(`Example values not supported for ${inspect(s)}`)
}
