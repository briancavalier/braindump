
import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none } from './result'
import { ArraySchema, UnionSchema, Schema, isNamedSchema, name, Decoded, Encoded } from './schema'

export const decode = <const S>(s: S) => (x: Encoded<S>): Ok<Decoded<S>> | Fail =>
  _decode(s as Schema, x)

export const encode = <const S>(s: S) => (x: Decoded<S>): Ok<Encoded<S>> | Fail =>
  _encode(s as Schema, x)

const _decode = (s: Schema, x: unknown): any => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean' === x)
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? decodeTuple(s, x) : unexpected(s, x)

  if (isNamedSchema(s)) {
    switch (s[name]) {
      case 'number':
      case 'string':
      case 'boolean':
        return s[name] === typeof x ? ok(x) : unexpected(s, x)
      case 'array':
        return Array.isArray(x) ? decodeArray(s as any, x) as any : unexpected(s, x)
      case 'union':
        return decodeUnion(s, x) as any
      case 'refine':
        return s.refine(x) ? ok(x) : unexpected(s, x)
      case 'map':
        return ok(s.ab(x))
      case 'codec':
        return s.decode(x)
      case 'pipe':
        return s.schemas.reduce((r: Ok<unknown> | Fail, schema) =>
          isOk(r) ? _decode(schema as any, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object' ? decodeRecord(s as Record<string, Schema>, x as Record<string, unknown>) as any : unexpected(s, x)

  return unexpected(s, x)
}

const decodeArray = <S extends ArraySchema<Schema>>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _decode(s.itemSchema as any, x[i] as any)
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const decodeTuple = <S extends readonly Schema[]>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _decode(s[i] as any, x[i] as any)
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const decodeRecord = <S extends Record<string, Schema>>(s: S, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    if(!(k in x)) e.push(at(k, missing(s[k])))
    else {
      const r = _decode(s[k] as any, x[k] as any)
      if (!isOk(r)) e.push(at(k, r))
      else a[k] = r.value
    }
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const decodeUnion = <S extends UnionSchema<readonly unknown[]>>(s: S, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _decode(s.schemas[i] as any, x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(x, e) as any
}

const _encode = (s: Schema, x: any): any => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean' === x)
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
        return Array.isArray(x) ? encodeArray(s as ArraySchema<Schema>, x) as any : unexpected(s, x)
      case 'union':
        return encodeUnion(s, x) as any
      case 'refine':
        return ok(x)
      case 'map':
        return ok(s.ba(x))
      case 'codec':
        return s.encode(x)
      case 'pipe':
        return s.schemas.reduceRight((r: Ok<unknown> | Fail, schema) =>
          isOk(r) ? _encode(schema as any, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object' ? encodeRecord(s as Record<string, Schema>, x as Record<string, unknown>) as any : unexpected(s, x)

  return unexpected(s, x)
}

const encodeArray = <S extends ArraySchema<Schema>>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _encode(s.itemSchema as any, x[i] as any)
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const encodeTuple = <S extends readonly Schema[]>(s: S, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _encode(s[i] as any, x[i] as any)
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const encodeRecord = <S extends Record<string, Schema>>(s: S, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    if (!(k in x)) e.push(at(k, missing(s[k])))
    else {
      const r = _encode(s[k] as any, x[k] as any)
      if (!isOk(r)) e.push(at(k, r))
      else a[k] = r.value
    }
  }
  return e.length === 0 ? ok(a) as any : all(x, e)
}

const encodeUnion = <S extends UnionSchema<readonly unknown[]>>(s: S, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _encode(s.schemas[i] as any, x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(x, e) as any
}
