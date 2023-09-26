import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none } from './result'
import { ArrayOf, Union, Schema, Decoded, Encoded, RecordOf, isOptional, schema, isNamed } from './schema'

export const encode = <const S>(s: S) => <const A extends Decoded<S>>(a: A): Ok<Encoded<S>> | Fail =>
  _encode(s as Schema, a)

const _encode = (s: Schema, x: unknown): Ok<any> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? encodeTuple(s, x) : unexpected(s, x)

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number':
      case 'string':
      case 'boolean':
        return ss === typeof x ? ok(x) : unexpected(s, x)
      case 'object':
      case 'array':
        return ok(x)
      case 'arrayOf':
        return Array.isArray(x) ? encodeArray(s as any, x) : unexpected(s, x)
      case 'record':
        return x && typeof x === 'object' && !Array.isArray(x)
          ? encodeRecord(s as any, x as Record<any, unknown>)
          : unexpected(s, x)
      case 'union':
        return encodeUnion(s as any, x)
      case 'refine':
        return ok(x)
      case 'total':
        return ok(s.ba(x))
      case 'part':
        return s.encode(x)
      case 'lift':
        return _encode(s.schema, x)
      case 'pipe':
        return s.codecs.reduceRight((r: Ok<unknown> | Fail, schema) =>
          isOk(r) ? _encode(schema as Schema, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object'
      ? encodeProperties(s as any, x as Record<string, unknown>)
      : unexpected(s, x)

  return unexpected(s, x)
}

const encodeArray = (s: ArrayOf<Schema>, x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < x.length; i++) {
    const r = _encode((s as any).items, x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeRecord = (s: RecordOf<Schema, Schema>, x: Record<any, unknown>) => {
  const a = {} as Record<any, unknown>
  const e = []
  for (const k of Object.keys(x)) {
    const rk = _encode((s as any).keys, k)
    if (!isOk(rk)) e.push(at(k, rk))
    else {
      const rv = _encode((s as any).values, x[k])
      if (!isOk(rv)) e.push(at(k, rv))
      else a[rk.value] = rv.value
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}


const encodeTuple = (s: readonly Schema[], x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < s.length; i++) {
    const r = _encode(s[i], x[i])
    if (!isOk(r)) e.push(at(i, r))
    else a[i] = r.value
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeProperties = (s: Record<string, Schema>, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    const sk = s[k]
    if (k in x) {
      const r = _encode(isOptional(sk) ? sk.schema as Schema : sk, x[k])
      if (!isOk(r)) e.push(k in x ? at(k, r) : missing(k, s[k]))
      else a[k] = r.value
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeUnion = (s: Union<readonly unknown[]>, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _encode(s.schemas[i] as Schema, x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(s, x, e)
}
