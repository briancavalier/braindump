import { Ok, Fail, ok, unexpected, isOk, at, all, missing, none, stopped } from './result'
import { ArrayOf, Union, Schema, Decoded, Encoded, RecordOf, isOptional, isNamed, schema, isRest, EnumOf } from './schema'

export const decode = <const S>(s: S) => <const A extends Encoded<S>>(a: A): Ok<Decoded<S>> | Fail =>
  _decode(s as Schema, a)

export const _decode = (s: Schema, x: unknown): Ok<any> | Fail => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean' || typeof s === 'bigint')
    return s === x ? ok(x) : unexpected(s, x)

  if (Array.isArray(s))
    return Array.isArray(x) ? decodeTuple(s, x) : unexpected(s, x)

  if (isNamed(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'number':
      case 'string':
      case 'boolean':
      case 'bigint':
        return ss === typeof x ? ok(x) : unexpected(s, x)
      case 'object':
        return x && typeof x === 'object' && !Array.isArray(x)
          ? ok(x)
          : unexpected(s, x)
      case 'array':
        return Array.isArray(x) ? ok(x) : unexpected(s, x)
      case 'enum':
        return decodeEnum(s, x)
      case 'union':
        return decodeUnion(s as any, x)
      case 'record':
        return x && typeof x === 'object' && !Array.isArray(x)
          ? decodeRecord(s as any, x as Record<any, unknown>)
          : unexpected(s, x)
      case 'arrayOf':
        return Array.isArray(x) ? decodeArray(s as any, x) : unexpected(s, x)
      case 'refine':
        return s.refine(x) ? ok(x) : unexpected(s, x)
      case 'transform':
        return s.decode(x)
      case 'lift':
        return _decode(s.schema, x)
      case 'pipe':
        return s.codecs.reduce((r: Ok<unknown> | Fail, schema) =>
          isOk(r) ? _decode(schema as Schema, r.value) : r, ok(x))
    }
  }

  if (s && typeof s === 'object')
    return x && typeof x === 'object'
      ? decodeProperties(s as any, x as Record<string, unknown>)
      : unexpected(s, x)

  return unexpected(s, x)
}

const decodeEnum = <Values extends Record<string, unknown>>(s: EnumOf<Values>, x: unknown) =>
  Object.values(s.values).indexOf(x) >= 0 ? ok(x as Values[keyof Values]) : unexpected(s, x)

const decodeArray = (s: ArrayOf<Schema>, x: readonly unknown[]) => {
  const r = decodeArrayItems((s as any).items, x)
  return isOk(r) ? r : stopped(x, r)
}

const decodeArrayItems = (items: Schema, x: readonly unknown[], i = 0) => {
  const a = []
  for (let k = 0; i < x.length; i++, k++) {
    const r = _decode(items, x[i])
    if (!isOk(r)) return at(i, r)
    else a[k] = r.value
  }
  return ok(a)
}

const decodeTuple = (s: readonly Schema[], x: readonly unknown[]) => {
  const a = []
  const e = []
  for (let i = 0; i < s.length; i++) {
    const si = s[i]
    if (isRest(si)) {
      const r = decodeArrayItems((si as any).items, x, i)
      if (!isOk(r)) e.push(r)
      else a.push(...r.value)
    } else if (i in x) {
      const r = _decode(si, x[i])
      if (!isOk(r)) e.push(at(i, r))
      else a[i] = r.value
    } else {
      e.push(missing(i, si))
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeRecord = (s: RecordOf<Schema, Schema>, x: Record<any, unknown>) => {
  const a = {} as Record<PropertyKey, unknown>
  for (const k of Object.keys(x)) {
    const rk = _decode((s as any).keys, k)
    if(!isOk(rk)) return stopped(x, at(k, rk))
    else {
      const rv = _decode((s as any).values, x[k])
      if(!isOk(rv)) return stopped(x, at(k, rv))
      else a[rk.value] = rv.value
    }
  }
  return ok(a)
}

const decodeProperties = (s: Record<string, Schema>, x: Record<string, unknown>) => {
  const a = {} as Record<string, unknown>
  const e = []
  for (const k of Object.keys(s)) {
    const sk = s[k]
    if(k in x) {
      const r = _decode(isOptional(sk) ? sk.schema as Schema : sk, x[k])
      if (!isOk(r)) e.push(at(k, r))
      else a[k] = r.value
    } else {
      if(!isOptional(s[k])) e.push(missing(k, sk))
    }
  }
  return e.length === 0 ? ok(a) : all(x, e)
}

const decodeUnion = (s: Union<readonly unknown[]>, x: unknown) => {
  const e = []
  for (let i = 0; i < s.schemas.length; i++) {
    const r = _decode(s.schemas[i] as Schema, x)
    if (isOk(r)) return r
    e.push(r)
  }
  return none(s, x, e)
}
