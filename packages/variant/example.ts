import { Variant, of, is } from './src'

// Build a simple Either type from Left and Right variants
type Left<A> = Variant<'left', A>
type Right<A> = Variant<'right', A>

// Variants are open: new types can be created with variant unions
type Either<E, A> = Left<E> | Right<A>

const e = of('right', 123) as Either<string, number>

// Recover variants using is
if(is('right')(e)) e
else e

const f = <E, A>(x: Either<E, A>) => {
  // case analysis via switch
  switch(x.tag) {
    case 'left':
      return console.log('Got left', x.value)
    case 'right':
      return console.log('Got right', x.value)
  }
}

f(of('right', 'hi'))

// Either is also open, and can be further composed with new variants
type Center<A> = Variant<'center', A>

type TriState<E, A, B> = Either<E, A> | Center<B>

// @ts-expect-error f only accepts Left or Right, not Center
f(of('center', 123))

const g = <E, A, B>(x: TriState<E, A, B>) => {
  switch (x.tag) {
    case 'center':
      return console.log('Got center', x.value)
    default:
      // Can only be Left or Right
      return f(x)
  }
}

g(of('center', 123))

const t = of('center', true) as TriState<string, number, boolean>

if (is('right')(t)) t
else if (is('left')(t)) t
else t

// Case analysis with switch
switch(t.tag) {
  case 'left': console.log('Got left', t.value); break
  case 'right': console.log('Got right', t.value); break
  case 'center': console.log('Got center', t.value); break
}
