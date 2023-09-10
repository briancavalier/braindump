
import { name } from './codec'
import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none } from './result'
import { ArraySchema, UnionSchema, Schema, isNamedSchema, Decoded, Encoded } from './schema'

export const encode = <const S>(s: S) => (x: Decoded<S>): Ok<Encoded<S>> | Fail =>
  _encode(s as Schema, x)

const _encode = (s: Schema, x: unknown): Ok<any> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? encodeTuple(s, x) : unexpected(s, x)

  if (isNamedSchema(s)) {
    switch (s[name]) {
      case 'number':
      case 'string':
      case 'boolean':
        return s[name] === typeof x ? ok(x) : unexpected(s, x)
      case 'array':
        return Array.isArray(x) ? encodeArray(s as ArraySchema<Schema>, x) : unexpected(s, x)
      case 'union':
        return encodeUnion(s as UnionSchema<readonly Schema[]>, x)
      case 'refine':
        return ok(x)
      case 'map':
        return ok(s.ba(x))
      case 'codec':
        return s.encode(x)
      case 'pipe':
        return s.codecs.reduceRight((r: Ok<unknown> | Fail, codec) =>
          isOk(r) ? _encode(codec, r.value) : r, ok(x))
      case 'schema':
        return _encode(s.schema as Schema, x)
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object'
      ? encodeRecord(s as Record<string, Schema>, x as Record<string, unknown>)
      : unexpected(s, x)

  return unexpected(s, x)
}

const encodeArray = <S extends ArraySchema<Schema>>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _encode(s.itemSchema, x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeTuple = <S extends readonly Schema[]>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _encode(s[i], x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeRecord = <S extends Record<string, Schema>>(s: S, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    if (!(k in x)) e.push(at(k, missing(s[k])))
    else {
      const r = _encode(s[k], x[k])
      if (!isOk(r)) e.push(at(k, r))
      else a[k] = r.value
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeUnion = <S extends UnionSchema<readonly Schema[]>>(s: S, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _encode(s.schemas[i], x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(x, e)
}
