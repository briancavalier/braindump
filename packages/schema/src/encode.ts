import { all, any, at, Fail, isOk, ok, Result, unexpected } from './result'
import { AnySchema, ArraySchema, isStructuredSchema, Infer, MapSchema, name, UnionSchema } from './schema'

export const encode = <S extends AnySchema>(s: S) => (a: Infer<S>): Result<unknown> =>
  // Typing`a` as Infer<S> here or in encodeSchema causes
  // excessive recursion.  Why?
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  encodeSchema(s, a)

const encodeSchema = <S extends AnySchema>(s: S, a: any): Result<unknown> => {
  if (s == null || typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean') {
    return a === s ? ok(a) : unexpected(s, a)
  } else if (Array.isArray(s)) {
    return encodeTuple(s, a)
  } else if (!isStructuredSchema(s)) {
    return encodeObject(s as any, a)
  }

  const n = s[name]
  switch (n) {
    case 'unknown':
    case 'number':
    case 'string':
    case 'boolean':
      return ok(a)
    case 'array':
      return encodeArray(s, a)
    case 'union':
      return encodeUnion(s, a)
    case 'refine':
      return ok(a)
    case 'map':
      return encodeMap(s, a)
  }
}

const encodeMap = <S extends MapSchema<AnySchema, any, any>>(s: S, x: unknown) => {
  const rr = s.ba(x)
  return isOk(rr) ? encodeSchema(s.schema, rr.value) : rr
}

const encodeTuple = <S extends readonly AnySchema[]>(s: S, x: readonly unknown[]) => {
  if (!Array.isArray(x)) return unexpected(s, x)
  const r = []
  const errors = [] as Fail[]
  for (let i = 0; i < s.length; ++i) {
    console.log(i, s[i], x[i])
    const ri = encodeSchema(s[i], x[i])
    if (!isOk(ri)) errors.push(at(i, ri))
    else r[i] = ri.value
  }
  return errors.length === 0 ? ok(r) : all('tuple', errors)
}

const encodeArray = <S extends ArraySchema<unknown>>(s: S, x: readonly unknown[]) => {
  if (!Array.isArray(x)) return unexpected(s, x)
  const ar = [] as any[]
  const errors = [] as Fail[]
  for (let i = 0; i < x.length; ++i) {
    const ri = encodeSchema(s.schema, x[i])
    if (!isOk(ri)) errors.push(at(i, ri))
    else ar[i] = ri.value
  }
  return errors.length === 0 ? ok(ar) : all('array', errors)
}

const encodeObject = <S extends Record<string, AnySchema>>(s: S, x: Record<string, unknown>) => {
  if (!x || typeof x !== 'object') return unexpected(s, x)
  const r = {} as any
  const errors = [] as Fail[]
  for (const k of Object.keys(s)) {
    const ri = encodeSchema(s[k], x[k])
    if (!isOk(ri)) errors.push(at(k, ri))
    else if (k in x) r[k] = ri.value
  }
  return errors.length === 0 ? ok(r) : all('object', errors)
}

const encodeUnion = <S extends UnionSchema<unknown>>(s: S, x: any) => {
  const errors = [] as Fail[]
  for (let i = 0; i < s.schemas.length; ++i) {
    const ri = encodeSchema(s.schemas[i], x)
    if (!isOk(ri)) errors.push(ri)
    else return ri
  }
  return any(s.schemas, errors)
}
