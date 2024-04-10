export interface EffectType {
  readonly type: unknown
  new (...args: readonly any[]): any
}

export interface AnyEffect {
  readonly type: unknown,
  readonly arg: unknown
}

export const Effect = <const T>(type: T) =>
  class <A> {
    public readonly type = type
    public static readonly type = type
    constructor(public readonly arg: A) { }
    request<R>() { return this as Fx<this, R> }
    *[Symbol.iterator](): Iterator<this, unknown, never> {
      return yield this
    }
  }

export const isEffect = <const Effect extends EffectType>(e: Effect, x: unknown): x is InstanceType<Effect> =>
  !!x && typeof x === 'object' && (x as any).type === e.type

export type Fx<Effects, A> = {
  [Symbol.iterator](): Iterator<Effects, A, unknown>
}

export type AnyFx = Fx<unknown, unknown>

export type Effects<F> = F extends Fx<infer Effects, unknown> ? Effects : never
export type Result<F> = F extends Fx<unknown, infer A> ? A : never

export const fx = <const Effects, const A>(f: () => Generator<Effects, A>) => ({
  [Symbol.iterator]: f
}) as Fx<Effects, A>

// eslint-disable-next-line require-yield
export const sync = <const A>(f: () => A) => fx(function* () { return f() })

// eslint-disable-next-line require-yield
export const pure = <const A>(a: A) => fx(function* () { return a })
