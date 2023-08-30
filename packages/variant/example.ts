import { Variant } from './src'

// Build a simple Either type from Left and Right variants
class Left<A> extends Variant('left')<A> { }
class Right<A> extends Variant('right')<A> { }

type Either<E, A> = Left<E> | Right<A>

const f = <E, A>(x: Either<E, A>) => {
  switch(x.tag) {
    case 'left':
      return console.log('Got left', x.value)
    case 'right':
      return console.log('Got right', x.value)
  }
}

f(Right.of('hi'))

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
