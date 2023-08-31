import { Variant, match } from './src'

// Build a simple Either type from Left and Right variants
class Left<A> extends Variant('left')<A> { }
class Right<A> extends Variant('right')<A> { }

// Variants are open: new types can be created from variants
type Either<E, A> = Left<E> | Right<A>

const e = Right.of(123) as Either<string, number>

// Recover variants using .is
if(Right.is(e)) e
else e

const f = <E, A>(x: Either<E, A>) => {
  // "pattern matching" via switch
  switch(x.tag) {
    case 'left':
      return console.log('Got left', x.value)
    case 'right':
      return console.log('Got right', x.value)
  }
}

f(Right.of('hi'))

// Either is also open, and can be further composed with new variants
class Center<A> extends Variant('center')<A> {}

type TriState<E, A, B> = Either<E, A> | Center<B>

// @ts-expect-error f only accepts Left or Right, not Center
f(Center.of(123))

const g = <E, A, B>(x: TriState<E, A, B>) => {
  switch (x.tag) {
    case 'center':
      return console.log('Got center', x.value)
    default:
      // Can only be Left or Right
      return f(x)
  }
}

g(Center.of(123))

const t = Center.of(true) as TriState<string, number, boolean>

if (Right.is(t)) t
else if (Left.is(t)) t
else t

// Case analysis with match()
const r = match(t, {
  left: x => x.length,
  right: x => x,
  center: x => x ? 1 : 0
})
