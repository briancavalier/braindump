// eslint-disable-next-line import/no-cycle
import { Fork } from '../../effects/fork/fork'
import { EffectType, Fx, FxIterable, is } from '../../fx'
import { pipe } from '../../pipe'
import { AnyHandler } from '../context'
import { Step } from '../step'

import { StateVar } from './state'

export class Handler implements Fx<unknown, unknown> {
  constructor(
    public readonly fx: FxIterable<unknown, unknown>,
    public readonly handler: AnyHandler,
    public readonly state: StateVar,
    public readonly forkable: boolean
  ) { }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }

  *[Symbol.iterator]() {
    const { handler, state, forkable, fx } = this
    const i = fx[Symbol.iterator]()

    try {
      state.value = handler.initially ? (yield* handler.initially) : state.value
      let ir = i.next()

      while (!ir.done) {
        if (matches(handler.effects, ir.value)) {
          const hr: Step<any, any, any> = yield* handler.handle((ir.value), state.value as never) as any
          switch (hr.tag) {
            case 'return':
              return handler.return ? handler.return(hr.value, state.value as never) : hr.value
            case 'resume':
              state.value = hr.state
              ir = i.next(hr.value)
              break
          }
        }
        else if (is(Fork, ir.value))
          ir = i.next(yield new Fork(ir.value.arg, [...ir.value.context, { handler, state, forkable }]))

        else
          ir = i.next(yield ir.value as any)
      }

      return handler.return ? handler.return(ir.value, state.value as never) : ir.value
    } finally {
      if (i.return) i.return()
      if (handler.finally) yield* handler.finally(state.value as never)
    }
  }
}

export const matches = <const E extends Effects, const T>(e: E, t: T): t is Instance<E> =>
  e.some(effectType => (t as any).id === effectType.id)

export type Effects = readonly EffectType[]

export type Instance<E extends Effects> = InstanceType<E[number]>
