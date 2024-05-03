import { EffectType, Fx, FxIterable } from '../fx'

import { Resume, Step } from './Continuation'
// eslint-disable-next-line import/no-cycle
import { RunHandler } from './RunHandler'

type Handled<Add, Remove, S, Interface> = {
  readonly [K in Extract<keyof Builder<Add, Remove, S>, Interface>]: Builder<Add, Remove, S>[K]
}

type Initially<Add, Remove, S> = Handled<Add, Remove, S, 'on' | 'finally' | 'handle'>
type On<Add, Remove, S> = Handled<Add, Remove, S, 'on' | 'finally' | 'handle'>
type Finally<Add, Remove, S> = Handled<Add, Remove, S, 'handle'>

type Return<E extends EffectType> = InstanceType<E>['R']

export class BuilderInit {
  static readonly forkable: boolean

  static initially<IE, S>(i: FxIterable<IE, S>): Initially<IE, never, S> {
    return new Builder(this.forkable, new Map(), i)
  }

  static finally<FE>(f: () => FxIterable<FE, void>): Finally<FE, never, void> {
    return new Builder(this.forkable, new Map(), undefined, f)
  }

  static on<E extends EffectType, OE, S, R2 = never>(
    e: E,
    f: (e: InstanceType<E>['arg'], s: S) => Fx<OE, Step<Return<E>, R2, S>>
  ): On<OE, InstanceType<E>, S> {
    return new Builder(this.forkable, new Map().set(e.id as PropertyKey, f))
  }

  static resume<const A>(a: A): Resume<A>
  static resume<const A, const S>(a: A, s: S): Resume<A, S>
  static resume<const A, const S>(a: A, s?: S): Resume<A, void | S> {
    return ({ tag: 'resume', value: a, state: s }) as const
  }

  static done<const A>(a: A): Step<never, A, never>{
    return ({ tag: 'return', value: a })
  }
}

export class Handler extends BuilderInit {
  static readonly forkable = true
}

export class Control extends BuilderInit {
  static readonly forkable = false
}

export class Builder<Add, Remove, S = void> {
  constructor(
    private readonly forkable: boolean,
    private readonly handlers: ReadonlyMap<PropertyKey, (e: unknown, s: S) => Fx<unknown, Step<unknown, unknown, S>>> = new Map(),
    private readonly _initially?: FxIterable<unknown, S>,
    private readonly _finally?: (s: S) => FxIterable<unknown, void>,
  ) { }

  initially<IE, S>(i: FxIterable<IE, S>): Initially<Add | IE, Remove, S> {
    return new Builder(this.forkable, this.handlers as any, i as any, this._finally as any)
  }

  finally<FE>(f: (s: S) => FxIterable<FE, void>): Finally<Add | FE, Remove, S> {
    return new Builder(this.forkable, this.handlers, this._initially, f)
  }

  on<Eff extends EffectType, OE, R2 = never>(e: Eff, f: (e: InstanceType<Eff>['arg'], s: S) => Fx<OE, Step<InstanceType<Eff>['R'], R2, S>>): On<Add | OE, Remove | InstanceType<Eff>, S> {
    const handlers = new Map(this.handlers).set(e.id as PropertyKey, f)
    return new Builder(this.forkable, handlers, this._initially, this._finally) as any
  }

  handle<E, A, R>(fx: Fx<E, A>, r: (r: A, s: S) => R): Fx<Add | Exclude<E, Remove>, R>
  handle<E, A>(fx: Fx<E, A>): Fx<Add | Exclude<E, Remove>, A>
  handle<E, A, R>(fx: Fx<E, A>, r?: (r: A, s: S) => R): Fx<E, A | R> {
    return new RunHandler(fx, this.forkable, { value: undefined }, this.handlers, this._initially, this._finally, r)
  }
}
