export interface ImmutableMap<Entries> {
  readonly size: number
  has(k: Keys<Entries>): boolean
  get<K extends Keys<Entries>>(k: K): ValueAt<K, Entries> | undefined
  [Symbol.iterator](): Iterator<Entries>
}

type Keys<Entries> = Entries extends readonly [infer K, unknown] ? K : never

type Values<Entries> = ValueAt<Keys<Entries>, Entries>

type ValueAt<K, Entries> = Entries extends readonly [infer HK, infer HV]
  ? K extends HK
    ? HV
    : never
  : never

export const empty: ImmutableMap<readonly [never, never]> = new Map<never, never>()

export const isEmpty = (
  m: ImmutableMap<readonly [unknown, unknown]>,
): m is ImmutableMap<readonly [never, never]> => m.size === 0

export const has = <Entries extends readonly [unknown, unknown]>(
  k: Keys<Entries>,
  m: ImmutableMap<Entries>,
): boolean => m.has(k)

export const of = <Entries extends readonly (readonly [unknown, unknown])[]>(
  ...entries: Entries
): ImmutableMap<From<Entries>> => from(entries)

export const from = <Entries extends Iterable<readonly [unknown, unknown]>>(
  entries: Entries,
): ImmutableMap<From<Entries>> => new Map(entries) as ImmutableMap<From<Entries>>

type From<Entries> = Entries extends Iterable<infer A> ? A : never

export const fromObject = <Entries extends Record<PropertyKey, unknown>>(
  entries: Entries,
): ImmutableMap<FromObject<Entries>> =>
  new Map(Object.entries(entries)) as ImmutableMap<FromObject<Entries>>

type FromObject<Entries> = Entries extends Record<PropertyKey, unknown>
  ? {
      [K in keyof Entries]: readonly [K, Entries[K]]
    }[keyof Entries]
  : never

export const set = <K, V, Entries extends readonly [unknown, unknown]>(
  k: K,
  v: V,
  m: ImmutableMap<Entries>,
): ImmutableMap<Entries | readonly [K, V]> => from([...m, [k, v]])

export const get = <Entries extends readonly [unknown, unknown], K extends Keys<Entries>>(
  k: K,
  m: ImmutableMap<Entries>,
): ValueAt<K, Entries> | undefined => m.get(k)

export const remove = <Entries extends readonly [unknown, unknown], K extends Keys<Entries>>(
  k: K,
  m: ImmutableMap<Entries>,
): ImmutableMap<Entries> => {
  const m1 = new Map(m)
  m1.delete(k)
  return m1 as ImmutableMap<Entries>
}

export const keys = <Entries extends readonly [unknown, unknown]>(
  m: ImmutableMap<Entries>,
): Iterable<Keys<Entries>> => (m instanceof Map ? m.keys() : new Map<any, any>(m).keys())

export const values = <Entries extends readonly [unknown, unknown]>(
  m: ImmutableMap<Entries>,
): Iterable<Values<Entries>> => (m instanceof Map ? m.values() : new Map<any, any>(m).values())
