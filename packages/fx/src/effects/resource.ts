import { Effect, Fx, fx, is, ok } from '../fx'
import { Control } from '../handler'

import { Fail, catchFail, fail } from './fail'

// ----------------------------------------------------------------------
// Resource effect to acquire and release resources within a scope

export type Resource<E, R> = Readonly<{
  acquire: Fx<E, R>
  release: (r: R) => Fx<E, void>
}>

export class Acquire<E> extends Effect<'fx/Resource', Resource<E, any>> { }

export const acquire = <const R, const E1, const E2>(
  acquire: Fx<E1, R>,
  release: (r: NoInfer<R>) => Fx<E2, void>
) => new Acquire<E1 | E2>({ acquire, release }).returning<R>()

export const bracket = <const A, const R, const E1, const E2, const E3>(
  acq: Fx<E1, R>,
  rel: (r: R) => Fx<E2, void>,
  use: (r: R) => Fx<E3, A>
) => scope(fx(function* () {
  return yield* use(yield* acquire(acq, rel))
}))

// Handler to scope resource allocation/release
export const scope = <const E, const A>(f: Fx<E, A>) => Control
  .initially(
    ok([] as readonly Fx<unknown, unknown>[])
  )
  .finally(
    resources => fx(function* () {
      const failures = yield* releaseSafely(resources)
      if (failures.length) return yield* fail(failures)
    })
  )
  .on(Acquire, ({ acquire, release }, resources) => fx(function* () {
    const a = yield* catchFail(acquire)

    if (is(Fail, a)) {
      const failures = releaseSafely(resources)
      return yield* fail([a.arg, ...failures])
    }

    return Control.resume(a, [release(a), ...resources])
  }))
  .handle(f) as Fx<UnwrapAcquire<E>, A>

const releaseSafely = (resources: readonly Fx<unknown, unknown>[]) => fx(function* () {
  const failures = [] as unknown[]
  for (const release of resources) {
    const r = yield* catchFail(release)
    if (is(Fail, r)) failures.push(r.arg)
  }
  return failures
})

type UnwrapAcquire<Effect> = Effect extends Acquire<infer E> ? E : Effect
