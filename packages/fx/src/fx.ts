export interface EffectType {
  readonly tag: unknown
  new (...args: readonly any[]): any
}

export interface AnyEffect {
  readonly tag: unknown,
  readonly arg: unknown
  readonly R: unknown
}

export const Effect = <const T>(tag: T) =>
  class <A, R = unknown> implements AnyEffect {
    public readonly tag = tag
    public static readonly tag = tag
    public readonly R!: R
    constructor(public readonly arg: A) { }
    send<RR extends R = R>() { return this as Fx<this, RR> }
    *[Symbol.iterator](): Iterator<this, unknown, any> {
      return yield this
    }
  } satisfies EffectType

export type Fx<Effects, A> = {
  [Symbol.iterator](): Iterator<Effects, A, unknown>
}

export const fx = <const Effects, const A>(f: () => Generator<Effects, A>) => ({
  [Symbol.iterator]: f
}) as Fx<Effects, A>

// eslint-disable-next-line require-yield
export const ok = <const A>(a: A) => fx(function* () { return a })

// eslint-disable-next-line require-yield
export const sync = <const A>(f: () => A) => fx(function* () { return f() })
