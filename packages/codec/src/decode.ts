
import { name } from './codec'
import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none } from './result'
import { ArraySchema, UnionSchema, Schema, isNamedSchema, Decoded, Encoded, RecordSchema } from './schema'

export const decode = <const S>(s: S) => (x: Encoded<S>): Ok<Decoded<S>> | Fail =>
  _decode(s as Schema, x)

const _decode = (s: Schema, x: unknown): Ok<any> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? decodeTuple(s, x) : unexpected(s, x)

  if (isNamedSchema(s)) {
    switch (s[name]) {
      case 'optional':
        return x === undefined ? ok(s.defaultValue)
          : _decode(s.schema as Schema, x)
      case 'number':
      case 'string':
      case 'boolean':
        return s[name] === typeof x ? ok(x) : unexpected(s, x)
      case 'array':
        return Array.isArray(x) ? decodeArray(s as ArraySchema<Schema>, x) : unexpected(s, x)
      case 'record':
        return x && typeof x === 'object' && !Array.isArray(x)
          ? decodeRecord(s as RecordSchema<Schema, Schema>, x as Record<any, unknown>)
          : unexpected(s, x)
      case 'union':
        return decodeUnion(s as UnionSchema<readonly Schema[]>, x)
      case 'refine':
        return s.refine(x) ? ok(x) : unexpected(s, x)
      case 'total':
        return ok(s.ab(x))
      case 'partial':
        return s.decode(x)
      case 'pipe':
        return s.codecs.reduce((r: Ok<unknown> | Fail, codec) =>
          isOk(r) ? _decode(codec, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object'
      ? decodeProperties(s as Record<string, Schema>, x as Record<string, unknown>)
      : unexpected(s, x)

  return unexpected(s, x)
}

const decodeArray = <S extends ArraySchema<Schema>>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _decode(s.items, x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeRecord = <S extends RecordSchema<Schema, Schema>>({ keys, values }: S, x: Record<any, unknown>) => {
  const a = {} as Record<any, unknown>
  const e = []
  for (const k of Object.keys(x)) {
    const rk = _decode(keys, k)
    if(!isOk(rk)) e.push(at(k, rk))
    else {
      const rv = _decode(values, x[k])
      if(!isOk(rv)) e.push(at(k, rv))
      else a[rk.value] = rv.value
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeTuple = <S extends readonly Schema[]>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _decode(s[i], x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeProperties = <S extends Record<string, Schema>>(s: S, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    const r = _decode(s[k], x[k])
    if (!isOk(r)) e.push(k in x ? at(k, r) : at(k, missing(s[k])))
    else a[k] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeUnion = <S extends UnionSchema<readonly Schema[]>>(s: S, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _decode(s.schemas[i], x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(x, e)
}
