// eslint-disable-next-line import/no-cycle
import { Fork } from '../effects/fork/Fork'
import { EffectType, Fx, is } from '../fx'
import { Pipeable, pipe } from '../internal/pipe'

import { Continue, Resume } from './Continue'

type Return<E extends EffectType> = InstanceType<E>['R']
type Arg<E extends EffectType> = InstanceType<E>['arg']

export const resume  = <const A> (value: A) => ({ done: false, value } as const)

export const done = <const A> (value: A) => ({ done: true, value } as const)

export const handle = <T extends EffectType, OnEffects, R2 = never> (e: T, f: (e: Arg<T>) => Fx<OnEffects, Resume<Return<T>>>) =>
  <const E, const A>(fx: Fx<E, A>) => {
    if(fx instanceof Handler)
      return new Handler(fx, fx.forkable && true, new Map(fx.handlers).set(e, f)) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R2>

    else return new Handler(fx, true, new Map().set(e, f)) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R2>
  }

export const control = <T extends EffectType, OnEffects, R2 = never>(e: T, f: (e: Arg<T>) => Fx<OnEffects, Continue<Return<T>, R2>>) =>
  <const E, const A>(fx: Fx<E, A>) => {
    if (fx instanceof Handler)
      return new Handler(fx, fx.forkable && true, new Map(fx.handlers).set(e, f)) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R2>

    else return new Handler(fx, false, new Map().set(e, f)) as Handler<Exclude<E, InstanceType<T>> | OnEffects, A | R2>
  }

export class Handler<E, A> implements Fx<E, A>, Pipeable {
  constructor(
    public readonly fx: Fx<E, A>,
    public readonly forkable: boolean,
    public readonly handlers: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, Continue<unknown, unknown>>> = new Map()
  ) { }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }

  *[Symbol.iterator](): Iterator<E, A> {
    const { handlers, fx } = this
    const i = fx[Symbol.iterator]()

    try {
      let ir = i.next()

      while (!ir.done) {
        if (isEffect(ir.value)) {
          const handle = handlers.get(ir.value.constructor) ?? undefined
          if (handle) {
            const hr: Continue<any, any> = yield* handle(ir.value.arg) as any
            if(hr.done) return hr.value
            else ir = i.next(hr.value)
          }
          else if (is(Fork, ir.value))
            ir = i.next(yield new Fork({
              fx: ir.value.arg.fx,
              context: [...ir.value.arg.context, this as any]
            }) as any)


          else
            ir = i.next(yield ir.value as any)
        }
      }

      return ir.value
    } finally {
      if (i.return) i.return()
    }
  }
}

const isEffect = <E>(e: E): e is E & { readonly arg: unknown } =>
  e && typeof e === 'object' && 'arg' in e //typeof (e as any)?.arg === 'string'
