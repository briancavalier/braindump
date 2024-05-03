// eslint-disable-next-line import/no-cycle
import { EffectType, Fx, FxIterable } from '../fx'

// eslint-disable-next-line import/no-cycle
import { RunHandler } from './RunHandler'
import { Step } from './Step'

export const handle = <E, A>(f: Fx<E, A>) => new Handler(f, true)

export const control = <E, A>(f: Fx<E, A>) => new Handler(f, false)

type Handled<E, A, S, Interface> = {
  readonly [K in Extract<keyof Handler<E, A, S>, Interface | keyof Fx<E, A>>]: Handler<E, A, S>[K]
}

type Initially<E, A, S> = Handled<E, A, S, 'on' | 'finally' | 'return'>
type On<E, A, S> = Handled<E, A, S, 'on' | 'finally' | 'return'>
type Finally<E, A, S> = Handled<E, A, S, 'return'>

export class Handler<E, A, S = void> {
  constructor(
    private readonly fx: Fx<E, A>,
    private readonly forkable: boolean,
    private readonly handlers: ReadonlyMap<PropertyKey, (e: unknown, s: S) => Fx<unknown, Step<unknown, unknown, S>>> = new Map(),
    private readonly _initially?: FxIterable<unknown, S>,
    private readonly _finally?: (s: S) => FxIterable<unknown, void>,
    private readonly _return?: (r: A, s: S) => unknown
  ) {}

  initially<IE, S>(i: FxIterable<IE, S>): Initially<IE | E, A, S> {
    return new Handler(this.fx, this.forkable, this.handlers as any, i as any, this._finally as any, this._return as any)
  }

  on<Eff extends EffectType, OE, R2 = never>(e: Eff, f: (e: InstanceType<Eff>['arg'], s: S) => Fx<OE, Step<InstanceType<Eff>['R'], R2, S>>): On<Exclude<E, InstanceType<Eff>> | OE, A | R2, S> {
    const handlers = new Map(this.handlers).set(e.id as PropertyKey, f)
    return new Handler(this.fx, this.forkable, handlers, this._initially, this._finally, this._return) as any
  }

  finally<FE>(f: (s: S) => FxIterable<FE, void>): Finally<E | FE, A, S> {
    return new Handler(this.fx, this.forkable, this.handlers, this._initially, f, this._return)
  }

  return<R>(r: (r: A, s: S) => R): Fx<E, R>
  return(): Fx<E, A>
  return<R>(r?: (r: A, s: S) => R): Fx<E, A | R> {
    return new RunHandler(this.fx, this.forkable, { value: undefined }, this.handlers, this._initially, this._finally, r)
  }
}
