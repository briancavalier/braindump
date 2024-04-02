import fc from 'fast-check'

import { assertOk } from './assert'
import { _decode } from './decode'
import { _encode } from './encode'
import { formatSchema } from './format'
import { Decoded, Encoded, isStructuredSchema, isOptional, schema, Pipe } from './schema'

export const decoded = <const S>(s: S): fc.Arbitrary<Decoded<S>> =>
  arbitrary(s, false)

export const encoded = <const S>(s: S): fc.Arbitrary<Encoded<S>> =>
  arbitrary(s, true)

function arbitrary<const S>(s: S, encoded: true): fc.Arbitrary<Encoded<S>>
function arbitrary<const S>(s: S, encoded: false): fc.Arbitrary<Decoded<S>>
function arbitrary<const S>(s: S, encoded: boolean): fc.Arbitrary<Decoded<S> | Encoded<S>>
function arbitrary<const S>(s: S, encoded: boolean): fc.Arbitrary<Decoded<S> | Encoded<S>> {
  if (s == null || typeof s === 'number' || typeof s === 'bigint' || typeof s === 'string' || typeof s === 'boolean')
    return fc.constant(s as any)

  if (Array.isArray(s))
    return fc.tuple(...s.map(s => arbitrary(s, encoded)) as any) as any

  if (isStructuredSchema(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'unknown': return fc.anything() as any
      case 'number': return fc.float() as any
      case 'bigint': return fc.bigInt() as any
      case 'int': return fc.integer() as any
      case 'float': return fc.float({ noNaN: true, noDefaultInfinity: true }) as any
      case 'string': return fc.string() as any
      case 'boolean': return fc.boolean() as any
      case 'object': return fc.object() as any
      case 'array': return fc.array(fc.anything()) as any
      case 'enum': return fc.constantFrom(...Object.values(s.values)) as any
      case 'union': return fc.oneof(...(s.schemas.map(s => arbitrary(s, encoded)) as any[])) as any
      case 'record': return fc.dictionary(arbitrary(s.keys, encoded) as any, arbitrary(s.values, encoded) as any) as any
      case 'array-of': return fc.array(arbitrary(s.items, encoded)) as any
      case 'template-literal':
        return arbitrary(s.schemas, encoded).map(x => x.join('')) as any
      case 'lift': return arbitrary(s.schema as any, encoded) as any
      case 'lazy': return s.name === 'JsonValue' ? fc.jsonValue() : arbitrary(s.f() as any, encoded) as any
      case 'pipe': return pipeArbitrary(s, encoded)
      default:
        throw new Error(`Don't know how to generate arbitrary value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object')
    return propertiesArbitrary(s as Record<string, unknown>, encoded)

  throw new Error(`Don't know how to generate arbitrary value for ${formatSchema(s)}`)
}

const pipeArbitrary = (s: Pipe<unknown, unknown>, encoded: boolean) => {
  const errors = []
  for (let i = s.codecs.length - 1; i >= 0; i--) {
    try {
      const x = arbitrary(s.codecs[i], encoded)
      return encoded
        ? x.map(x => assertOk(_encode({ [schema]: 'pipe', codecs: s.codecs.slice(0, i) }, x) as any)) as any
        : x.map(x => assertOk(_decode({ [schema]: 'pipe', codecs: s.codecs.slice(i) }, x) as any)) as any
    } catch (e) {
      errors.push(e)
    }
  }
  throw new Error(`Don't know how to generate arbitrary value for ${formatSchema(s)}: ${errors}`)
}

const propertiesArbitrary = (s: Record<string, unknown>, encoded: boolean) => {
  const a = {} as { [s: string]: fc.Arbitrary<unknown>}
  const requiredKeys = []
  for (const k of Object.keys(s)) {
    const sk = (s as Record<string, any>)[k]
    if (isOptional(sk)) {
      a[k] = arbitrary(sk.schema, encoded)
    } else {
      a[k] = arbitrary(sk, encoded)
      requiredKeys.push(k)
    }
  }

  return fc.record(a, { requiredKeys }) as any
}
