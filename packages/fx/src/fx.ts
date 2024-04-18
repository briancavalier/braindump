export interface EffectType {
  readonly tag: unknown
  new (...args: readonly any[]): any
}

export const Effect = <const T>(tag: T) =>
  class <A, R = unknown> {
    public readonly tag = tag
    public static readonly tag = tag
    public readonly R!: R

    send<RR extends R = R>() { return this as Fx<this, RR> }

    constructor(public readonly arg: A) { }

    *[Symbol.iterator](): Iterator<this, unknown, any> {
      return yield this
    }
  } satisfies EffectType

export type Fx<E, A> = {
  [Symbol.iterator](): Iterator<E, A, unknown>
}

export const is = <const E extends EffectType>(e: E, x: unknown): x is InstanceType<E> =>
  !!x && (x as any).tag === e.tag

export const fx = <const E, const A>(f: () => Generator<E, A>) => ({
  [Symbol.iterator]: f
}) as Fx<E, A>

// eslint-disable-next-line require-yield
export const ok = <const A>(a: A) => fx(function* () { return a })

// eslint-disable-next-line require-yield
export const sync = <const A>(f: () => A) => fx(function* () { return f() })
