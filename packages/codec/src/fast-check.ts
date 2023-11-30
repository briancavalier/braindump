import fc from 'fast-check'

import { assertOk } from './assert'
import { _decode } from './decode'
import { _encode } from './encode'
import { formatSchema } from './format'
import { Decoded, Encoded, isStructuredSchema, isOptional, schema } from './schema'

export const arbitraryDecoded = <const S>(s: S): fc.Arbitrary<Decoded<S>> => {
  if (s == null || typeof s === 'number' || typeof s === 'bigint' || typeof s === 'string' || typeof s === 'boolean')
    return fc.constant(s as any)

  if (Array.isArray(s))
    return fc.tuple(...s.map(s => arbitraryDecoded(s)) as any) as any

  if (isStructuredSchema(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'never':
        return fc.integer().map(() => {
          throw new Error(`Can't generate decoded value for ${formatSchema(s)}`)
        })
      case 'unknown': return fc.anything() as any
      case 'number': return fc.float() as any
      case 'bigint': return fc.bigInt() as any
      case 'string': return fc.string() as any
      case 'boolean': return fc.boolean() as any
      case 'object': return fc.object() as any
      case 'array': return fc.array(fc.anything()) as any
      case 'enum': return fc.constantFrom(...Object.values(s.values)) as any
      case 'union': return fc.oneof(...(s.schemas.map(arbitraryDecoded as any) as any[])) as any
      case 'record': return fc.dictionary(arbitraryDecoded(s.keys as any), arbitraryDecoded(s.values) as any) as any
      case 'array-of': return fc.array(arbitraryDecoded(s.items as any) as any) as any
      case 'template-literal':
        return arbitraryDecoded(s.schemas).map(x => x.join('')) as any
      case 'lift': return arbitraryDecoded(s.schema as any) as any
      case 'pipe': {
        const errors = []
        for (let i = s.codecs.length - 1; i >= 0; i--) {
          try {
            const x = arbitraryDecoded(s.codecs[i] as any)
            return x.map(x => assertOk(_decode({ [schema]: 'pipe', codecs: s.codecs.slice(i) }, x))) as any
          } catch(e) {
            errors.push(e)
          }
        }
        throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}: ${errors}`)
      }
      default:
        throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: fc.Arbitrary<unknown> }
    const requiredKeys = []
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]
      if(isOptional(sk)) {
        a[k] = arbitraryDecoded(sk.schema)
      } else {
        a[k] = arbitraryDecoded(sk)
        requiredKeys.push(k)
      }
    }

    return fc.record(a, { requiredKeys }) as any
  }

  throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
}

export const arbitraryEncoded = <const S>(s: S): fc.Arbitrary<Encoded<S>> => {
  if (s == null || typeof s === 'number' || typeof s === 'bigint' || typeof s === 'string' || typeof s === 'boolean')
    return fc.constant(s as any)

  if (Array.isArray(s))
    return fc.tuple(...s.map(arbitraryEncoded as any) as any) as any

  if (isStructuredSchema(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'never':
        return fc.integer().map(() => {
          throw new Error(`Can't generate decoded value for ${formatSchema(s)}`)
        })
      case 'unknown': return fc.anything() as any
      case 'number': return fc.float() as any
      case 'bigint': return fc.bigInt() as any
      case 'string': return fc.string() as any
      case 'boolean': return fc.boolean() as any
      case 'object': return fc.object() as any
      case 'array': return fc.array(fc.anything()) as any
      case 'enum': return fc.constantFrom(...Object.values(s.values)) as any
      case 'union': return fc.oneof(...(s.schemas.map(arbitraryEncoded as any) as any[])) as any
      // @ts-expect-error infinite
      case 'record': return fc.dictionary(arbitraryEncoded(s.keys as any), arbitraryEncoded(s.values) as any) as any
      case 'array-of': return fc.array(arbitraryEncoded(s.items as any) as any) as any
      case 'lift': return arbitraryEncoded(s.schema as any) as any
      case 'pipe': {
        const errors = []
        for (let i = s.codecs.length - 1; i >= 0; i--) {
          try {
            const x = arbitraryDecoded(s.codecs[i] as any)
            return x.map(x => assertOk(_encode({ [schema]: 'pipe', codecs: s.codecs.slice(0, i) }, x))) as any
          } catch (e) {
            errors.push(e)
          }
        }
        throw new Error(`Don't know how to generate encoded value for ${formatSchema(s)}: ${errors}`)
      }
      default:
        throw new Error(`Don't know how to generate encoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: fc.Arbitrary<unknown> }
    const requiredKeys = []
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]
      if (isOptional(sk)) {
        a[k] = arbitraryEncoded(sk.schema as any)
      } else {
        a[k] = arbitraryEncoded(sk)
        requiredKeys.push(k)
      }
    }

    return fc.record(a, { requiredKeys }) as any
  }

  throw new Error(`Don't know how to generate encoded value for ${formatSchema(s)}`)
}
