import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none, stopped } from './result'
import { ArrayOf, Union, Schema, Decoded, Encoded, RecordOf, isOptional, schema, isStructuredSchema, isRest } from './schema'

export const encode = <const S>(s: S) => <const A extends Decoded<S>>(a: A): Ok<Encoded<S>> | Fail =>
  _encode(s, a)

export const _encode = (s: unknown, x: unknown): Ok<any> | Fail => {
  if (typeof s === 'number')
    return Number.isNaN(x) && Number.isNaN(x) ? ok(x)
      : s === x ? ok(x)
        : unexpected(s, x)

  if (s == null || typeof s === 'string' || typeof s === 'boolean' || typeof s === 'bigint')
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? encodeTuple(s, x) : unexpected(s, x)

  if (isStructuredSchema(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'never':
        return unexpected(s, x)
      case 'unknown':
        return ok(x)
      case 'number':
      case 'string':
      case 'boolean':
        return ss === typeof x ? ok(x) : unexpected(s, x)
      case 'bigint':
      case 'object':
      case 'array':
      case 'enum':
        return ok(x)
      case 'array-of':
        return Array.isArray(x) ? encodeArray(s as any, x) : unexpected(s, x)
      case 'record':
        return x && typeof x === 'object' && !Array.isArray(x)
          ? encodeRecord(s as any, x as Record<any, unknown>)
          : unexpected(s, x)
      case 'union':
        return encodeUnion(s as any, x)
      case 'refine':
        return ok(x)
      case 'transform':
        return s.encode(x)
      case 'lift':
        return _encode(s.schema, x)
      case 'pipe':
        return s.codecs.reduceRight((r: Ok<unknown> | Fail, schema) =>
          isOk(r) ? _encode(schema, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object'
      ? encodeProperties(s as any, x as Record<string, unknown>)
      : unexpected(s, x)

  return unexpected(s, x)
}

const encodeArray = (s: ArrayOf<unknown>, x: readonly unknown[]) => {
  const r = encodeArrayItems(s.items as Schema, x)
  return isOk(r) ? r : stopped(x, r)
}

const encodeArrayItems = (items: Schema, x: readonly unknown[], i = 0) => {
  const a = []
  for (let k = 0; i < x.length; i++, k++) {
    const r = _encode(items, x[i])
    if (!isOk(r)) return at(i, r)
    else a[k] = r.value
  }
  return ok(a)
}

const encodeTuple = (s: readonly Schema[], x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < s.length; i++) {
    const si = s[i]
    if (isRest(si)) {
      const r = encodeArrayItems((si as any).items, x, i)
      if (!isOk(r)) e.push(r)
      else a.push(...r.value)
    } else if (i in x) {
      const r = _encode(si, x[i])
      if (!isOk(r)) e.push(at(i, r))
      else a[i] = r.value
    } else {
      e.push(missing(i, si))
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const encodeRecord = (s: RecordOf<Schema, Schema>, x: Record<any, unknown>) => {
  const a = {} as Record<any, unknown>
  for (const k of Object.keys(x)) {
    const rk = _encode((s as any).keys, k)
    if (!isOk(rk)) return stopped(x, at(k, rk))
    else {
      const rv = _encode((s as any).values, x[k])
      if (!isOk(rv)) return stopped(x, at(k, rv))
      else a[rk.value] = rv.value
    }
  }
  return ok(a)
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
