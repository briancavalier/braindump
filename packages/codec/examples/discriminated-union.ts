import { union, string, number, decode, assertOk } from '../src'

const animal = union(
  { type: 'dog', foo: string, age: number },
  { type: 'cat', bar: string, age: number },
)

const a = {
  type: 'bird',
  name: 'tweety',
  age: 5
}

const r = decode(animal)(a)

console.log(assertOk(r))
