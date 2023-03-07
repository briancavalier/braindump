import { Result, ok, unexpected, isOk, Fail, at, all, missing, any } from './result'
import { AnySchema, ArrayOf, Infer, isSchema, node, Refine, schema, Schema, Union } from './schema'

export const decode = <S extends AnySchema>(s: S) => (x: unknown): Result<Infer<S>> =>
  decodeSchema(s, x)

const decodeSchema = <S extends AnySchema>(s: S, x: unknown): Result<any> => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean') {
    return x === s ? ok(x) : unexpected(s, x)
  } else if (Array.isArray(s)) {
    return decodeTuple(s, x)
  } else if (!isSchema(s)) {
    return decodeObject(s as any, x)
  }

  const n = s[node]
  switch (n.name) {
    case 'unknown':
      return ok(x)
    case 'number':
      return typeof x === 'number' ? ok(x) : unexpected(s, x)
    case 'string':
      return typeof x === 'string' ? ok(x) : unexpected(s, x)
    case 'boolean':
      return typeof x === 'boolean' ? ok(x) : unexpected(s, x)
    case 'array':
      return decodeArray(n, x)
    case 'union':
      return decodeUnion(n, x)
    case 'refine':
      return decodeRefine(n, x)
  }
}

const decodeRefine = <S extends Refine<AnySchema, any, unknown>>(s: S, x: unknown) => {
  const rr = decodeSchema(s.schema, x)
  return isOk(rr) ? s.ab(rr.value)
    ? ok(rr.value) : unexpected(schema(s), rr.value)
    : rr
}

const decodeTuple = <S extends readonly Schema<unknown>[]>(s: S, x: unknown) => {
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

const decodeArray = <S extends ArrayOf<AnySchema>>(s: S, x: unknown) => {
  if (!Array.isArray(x)) return unexpected(schema(s), x)
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
    if (!isOk(ri)) errors.push(k in x ? at(k, ri) : missing(k, s[k]))
    else if (k in x) r[k] = ri.value
  }
  return errors.length === 0 ? ok(r) : all('object', errors)
}

const decodeUnion = <S extends Union<readonly AnySchema[]>>(s: S, x: unknown) => {
  const errors = [] as Fail[]
  for (let i = 0; i < s.schemas.length; ++i) {
    const ri = decodeSchema(s.schemas[i], x)
    if (!isOk(ri)) errors.push(ri)
    else return ri
  }
  return any(s.schemas, errors)
}
