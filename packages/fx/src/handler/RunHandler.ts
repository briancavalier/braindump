// eslint-disable-next-line import/no-cycle
import { Fork } from '../effects/fork/fork'
import { Fx, FxIterable, is } from '../fx'
import { pipe } from '../pipe'

import { Continue } from './Continuation'

type HandlerState<S> = {
  value: S | undefined
}

export type HandlerContext = HandlerFx<unknown, unknown, unknown>

export class HandlerFx<E, A, S = void> implements Fx<E, A> {
  constructor(
    public readonly fx: Fx<E, A>,
    public readonly forkable: boolean,
    public readonly state: HandlerState<S>,
    public readonly handlers: ReadonlyMap<unknown, (e: unknown, s: S) => Fx<unknown, Continue<unknown, unknown, S>>> = new Map(),
    public readonly _initially?: FxIterable<unknown, S>,
    public readonly _finally?: (s: S) => FxIterable<unknown, void>,
    public readonly _return?: (r: A, s: S) => unknown
  ) { }

  // eslint-disable-next-line prefer-rest-params
  pipe() { return pipe(this, arguments) }

  *[Symbol.iterator]() {
    const { handlers, state, fx, _initially, _finally, _return } = this
    const i = fx[Symbol.iterator]()

    try {
      state.value = _initially ? (yield* _initially) : state.value
      let ir = i.next()

      while (!ir.done) {
        if (isEffect(ir.value)) {
          const handle = handlers.get(ir.value.constructor) ?? undefined
          if (handle) {
            const hr: Continue<any, any, S> = yield* handle(ir.value.arg, state.value as never) as any
            switch (hr.tag) {
              case 'return':
                return _return ? _return(hr.value, state.value as never) : hr.value
              case 'resume':
                state.value = hr.state
                ir = i.next(hr.value)
                break
            }
          }
          else if (is(Fork, ir.value))
            ir = i.next(yield new Fork({
              fx: ir.value.arg.fx,
              context: [...ir.value.arg.context, this as HandlerContext]
            }))


          else
            ir = i.next(yield ir.value as any)
        }
      }

      return _return ? _return(ir.value, state.value as never) : ir.value
    } finally {
      if (i.return) i.return()
      if (_finally) yield* _finally(state.value as never)
    }
  }
}

const isEffect = <E>(e: E): e is E & { readonly arg: unknown}  => e && typeof e === 'object' && 'arg' in e //typeof (e as any)?.arg === 'string'
