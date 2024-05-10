// eslint-disable-next-line import/no-cycle
import { Fork } from '../effects/fork/Fork'
import { EffectType, Fx, is, isEffect } from '../fx'
import { Pipeable, pipe } from '../internal/pipe'

import { Continue } from './Continue'

type Return<E extends EffectType> = InstanceType<E>['R']
type Arg<E extends EffectType> = InstanceType<E>['arg']

export const resume  = <const A> (value: A) => ({ done: false, value } as const)

export const done = <const A> (value: A) => ({ done: true, value } as const)

export const handle = <T extends EffectType, OnEffects> (e: T, f: (e: Arg<T>) => Fx<OnEffects, Return<T>>) =>
  <const E, const A>(fx: Fx<E, A>): Handler<Exclude<E, InstanceType<T>> | OnEffects, A> =>
    (isHandler(fx)
      ? new Handler(fx, new Map(fx.handlers).set(e._fxEffectId, f), fx.controls)
      : new Handler(fx, new Map().set(e._fxEffectId, f), empty)) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A>

export const control = <T extends EffectType, OnEffects, R = never>(e: T, f: (e: Arg<T>) => Fx<OnEffects, Continue<Return<T>, R>>) =>
  <const E, const A>(fx: Fx<E, A>): Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R> =>
    (isHandler(fx)
      ? new Handler(fx, fx.handlers, new Map(fx.controls).set(e._fxEffectId, f))
      : new Handler(fx, empty, new Map().set(e._fxEffectId, f))) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R>

export const HandlerTypeId = Symbol('fx/Handler')

export class Handler<E, A> implements Fx<E, A>, Pipeable {
  public readonly _fxTypeId = HandlerTypeId

  constructor(
    public readonly fx: Fx<E, A>,
    public readonly handlers: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, unknown>>,
    public readonly controls: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, Continue<unknown, unknown>>>
  ) { }

  pipe() { return pipe(this, arguments) }

  *[Symbol.iterator](): Iterator<E, A> {
    const { handlers, controls, fx } = this
    const i = fx[Symbol.iterator]()

    try {
      let ir = i.next()

      while (!ir.done) {
        if (isEffect(ir.value)) {
          const handle = handlers.get(ir.value._fxEffectId)
          if (handle) {
            ir = i.next(yield* handle(ir.value.arg) as any)
          } else {
            const control = controls.get(ir.value._fxEffectId)
            if (control) {
              const hr: Continue<any, any> = yield* control(ir.value.arg) as any
              if(hr.done) return hr.value
              else ir = i.next(hr.value)
            } else if (is(Fork, ir.value)) {
              ir = i.next(yield new Fork({ ...ir.value.arg, context: [...ir.value.arg.context, this] }) as any)
            } else {
              ir = i.next(yield ir.value as any)
            }
          }
        }
      }

      return ir.value
    } finally {
      if (i.return) i.return()
    }
  }
}

export const isHandler = (e: unknown): e is Handler<unknown, unknown> =>
  !!e && (e as any)._fxTypeId === HandlerTypeId

const empty = new Map() as Map<never, never>
