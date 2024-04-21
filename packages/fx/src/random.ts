import prand, { RandomGenerator } from 'pure-rand'

import { Effect, Fx, fx, ok } from './fx'
import { handle, resume } from './handler'

export class Float extends Effect('fx/Random.Float')<void, number> { }
export const float = new Float().send<number>()

export class Int extends Effect('fx/Random.Int')<{ readonly min: number, readonly max: number }, number> { }
export const int = (min: number, max: number) => new Int({ min, max }).send<number>()

export const boolean = fx(function* () {
  return (yield* int(0, 1)) === 0
})

export class Split extends Effect('fx/Random.Split')<Fx<unknown, unknown>, Fx<unknown, unknown>> { }

export const split = <const E, const A>(f: Fx<E, A>) => fx(function* () {
  const f2 = yield* new Split(f).send<Fx<E | Split, A>>()
  return yield* f2
})

export const MIN_INT = 0x80000000 | 0;
export const MAX_INT = 0x7fffffff | 0
const DBL_FACTOR = Math.pow(2, 27);
const DBL_DIVISOR = Math.pow(2, -53)

export const xoroshiro128plus = <const E, const A>(seed: number, f: Fx<E, A>) =>
  _xoroshiro128plus(prand.xoroshiro128plus(seed), f)

const _xoroshiro128plus = <const E, const A>(prng: RandomGenerator, f: Fx<E, A>): Fx<Exclude<E, Float | Int | Split>, A> => handle(f, [Float, Int, Split], {
  initially: ok(prng),
  handle(e, prng) {
    switch (e.tag) {
      case 'fx/Random.Float': {
        const a = prand.unsafeUniformIntDistribution(0, (1 << 26) - 1, prng)
        const b = prand.unsafeUniformIntDistribution(0, (1 << 27) - 1, prng)
        return ok(resume((a * DBL_FACTOR + b) * DBL_DIVISOR, prng));
      }
      case 'fx/Random.Int':
        return ok(resume(prand.unsafeUniformIntDistribution(e.arg.min, e.arg.max, prng), prng))
      case 'fx/Random.Split': {
        const p2 = prng.jump!()
        return ok(resume(_xoroshiro128plus(p2, e.arg), p2.jump!()))
      }
    }
  },
})
