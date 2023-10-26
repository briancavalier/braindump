
import { faker as F } from '@faker-js/faker'

import { _decode } from './decode'
import { formatSchema } from './format'
import { Fail, Ok, failed, isOk, ok, sequence } from './result'
import { Decoded, Encoded, Schema, isNamed, isOptional, schema } from './schema'


export const arbitraryDecoded = <const S extends Schema>(s: S): Ok<Decoded<S>> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return ok(s) as Ok<Decoded<S>>

  if (Array.isArray(s))
    return sequence(s.map(arbitraryDecoded)) as any

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number': return ok(F.number.float({ min: -1000, max: 1000 })) as any
      case 'bigint': return ok(F.number.bigInt()) as any
      case 'string': return ok(F.string.alphanumeric({ length: { min: 0, max: 20 } })) as any
      case 'boolean': return ok(F.datatype.boolean()) as any
      case 'object': return ok({}) as any
      case 'array': return ok([]) as any
      case 'enum': return ok(F.helpers.objectValue(s.values)) as any
      case 'union': return arbitraryDecoded(F.helpers.arrayElement(s.schemas) as any)
      case 'record': {
        const length = F.number.int({ max: 100 })
        const entries = sequence(Array.from({ length },
          () => sequence([arbitraryDecoded(s.keys as any), arbitraryDecoded(s.values as any)])))
        return isOk(entries) ? ok(Object.fromEntries(entries.value) as any) : entries
      }
      case 'arrayOf': return sequence(Array.from({ length: F.number.int({ max: 100 }) }, () => arbitraryDecoded(s.items as any))) as any
      case 'lift': return arbitraryDecoded(s.schema as any)
      case 'pipe': {
        for (let i = s.codecs.length - 1; i >= 0; i--) {
          // @ts-expect-error infinite
          const x = arbitraryDecoded(s.codecs[i] as Schema)
          if(isOk(x)) return _decode({ [schema]: 'pipe', codecs: s.codecs.slice(i) }, x.value)
          // eslint-disable-next-line no-empty
        }
        return failed(s, `Don't know how to generate decoded value for ${formatSchema(s)}`)
      }
      default:
        return failed(s, `Don't know how to generate decoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: unknown }
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]

      if (isOptional(sk)) {
        if (F.datatype.boolean()) {
          const r = arbitraryDecoded(sk.schema as any)
          if(!isOk(r)) return r
          a[k] = r.value
        }
      } else {
        const r = arbitraryDecoded(sk)
        if(!isOk(r)) return r
        a[k] = r.value
      }
    }
    return ok(a) as any
  }

  return failed(s, `Don't know how to generate decoded value for ${formatSchema(s)}`)
}


export const arbitraryEncoded = <const S extends Schema>(s: S): Ok<Encoded<S>> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return ok(s) as Ok<Encoded<S>>

  if (Array.isArray(s))
    return sequence(s.map(arbitraryEncoded)) as any

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number': return ok(F.number.float({ min: -1000, max: 1000 })) as any
      case 'bigint': return ok(F.number.bigInt()) as any
      case 'string': return ok(F.string.alphanumeric({ length: { min: 0, max: 20 } })) as any
      case 'boolean': return ok(F.datatype.boolean()) as any
      case 'object': return ok({}) as any
      case 'array': return ok([]) as any
      case 'enum': return ok(F.helpers.objectValue(s.values)) as any
      case 'union': return arbitraryEncoded(F.helpers.arrayElement(s.schemas) as any) as any
      case 'record': {
        const length = F.number.int({ max: 100 })
        const entries = sequence(Array.from({ length },
          () => sequence([arbitraryEncoded(s.keys as any), arbitraryEncoded(s.values as any)])))
        return isOk(entries) ? ok(Object.fromEntries(entries.value) as any) : entries
      }
      case 'arrayOf': return sequence(Array.from({ length: F.number.int({ max: 100 }) }, () => arbitraryEncoded(s.items as any))) as any
      case 'lift': return arbitraryEncoded(s.schema as any) as any
      case 'pipe': {
        for (let i = 0; i < s.codecs.length; i++) {
          const x = arbitraryEncoded(s.codecs[i] as Schema)
          if (isOk(x)) return _decode({ [schema]: 'pipe', codecs: s.codecs.slice(0, i) }, x.value)
          // eslint-disable-next-line no-empty
        }
        return failed(s, `Don't know how to generate encoded value for ${formatSchema(s)}`)
      }
      default:
        return failed(s, `Don't know how to generate encoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: unknown }
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]

      if (isOptional(sk)) {
        if (F.datatype.boolean()) {
          const r = arbitraryEncoded(sk.schema as any)
          if (!isOk(r)) return r
          a[k] = r.value
        }
      } else {
        const r = arbitraryEncoded(sk)
        if (!isOk(r)) return r
        a[k] = r.value
      }
    }
    return ok(a) as any
  }

  return failed(s, `Don't know how to generate encoded value for ${formatSchema(s)}`)
}
