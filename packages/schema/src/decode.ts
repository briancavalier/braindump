import { Result, ok, unexpected, isOk, Fail, at, all, missing, any } from './result'
import { AnySchema, ArraySchema, Infer, isStructuredSchema, name, RefineSchema, UnionSchema, MapSchema } from './schema'

export const decode = <S extends AnySchema>(s: S) => (x: unknown): Result<Infer<S>> =>
  decodeSchema(s, x)

const decodeSchema = <S extends AnySchema>(s: S, x: unknown): Result<any> => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean') {
    return x === s ? ok(x) : unexpected(s, x)
  } else if (Array.isArray(s)) {
    return decodeTuple(s, x)
  } else if (!isStructuredSchema(s)) {
    return decodeObject(s as any, x)
  }

  const n = s[name]
  switch (n) {
    case 'unknown':
      return ok(x)
    case 'number':
      return typeof x === 'number' ? ok(x) : unexpected(s, x)
    case 'string':
      return typeof x === 'string' ? ok(x) : unexpected(s, x)
    case 'boolean':
      return typeof x === 'boolean' ? ok(x) : unexpected(s, x)
    case 'array':
      return decodeArray(s, x)
    case 'union':
      return decodeUnion(s, x)
    case 'refine':
      return decodeRefine(s, x)
    case 'map':
      return decodeMap(s, x)
  }
}

const decodeRefine = <S extends RefineSchema<AnySchema, any, unknown>>(s: S, x: unknown) => {
  const r = decodeSchema(s.schema, x)
  return isOk(r) ? s.refine(r.value)
    ? ok(r.value) : unexpected(s, r.value)
    : r
}

const decodeMap = <S extends MapSchema<AnySchema, any, any>>(s: S, x: unknown) => {
  const r = decodeSchema(s.schema, x)
  return isOk(r) ? s.ab(r.value) : r
}

const decodeTuple = <S extends { readonly [K: number]: AnySchema; readonly length: number }>(s: S, x: unknown) => {
  if (!Array.isArray(x)) return unexpected(s, x)
  const r = []
  const errors = [] as Fail[]
  for (let i = 0; i < s.length; ++i) {
    const ri = decodeSchema(s[i], x[i])
    if (!isOk(ri)) errors.push(at(i, ri))
    else r[i] = ri.value
  }
  return errors.length === 0 ? ok(r) : all('tuple', errors)
}

const decodeArray = <S extends ArraySchema<unknown>>(s: S, x: unknown) => {
  if (!Array.isArray(x)) return unexpected(s, x)
  const ar = [] as any[]
  const errors = [] as Fail[]
  for (let i = 0; i < x.length; ++i) {
    const ri = decodeSchema(s.schema, x[i])
    if (!isOk(ri)) errors.push(at(i, ri))
    else ar[i] = ri.value
  }
  return errors.length === 0 ? ok(ar) : all('array', errors)
}

const decodeObject = <S extends { readonly [K in string]: AnySchema }>(s: S, x: unknown) => {
  if (!x || typeof x !== 'object') return unexpected(s, x)
  const r = {} as any
  const errors = [] as Fail[]
  const o = x as Record<string, unknown>
  for (const k of Object.keys(s)) {
    const ri = decodeSchema(s[k], o[k])
    if (!isOk(ri)) errors.push(at(k, k in x ? ri : missing(s[k])))
    else r[k] = ri.value
  }
  return errors.length === 0 ? ok(r) : all('object', errors)
}

const decodeUnion = <S extends UnionSchema<unknown>>(s: S, x: unknown) => {
  const errors = [] as Fail[]
  for (let i = 0; i < s.schemas.length; ++i) {
    const ri = decodeSchema(s.schemas[i], x)
    if (!isOk(ri)) errors.push(ri)
    else return ri
  }
  return any(s.schemas, errors)
}
