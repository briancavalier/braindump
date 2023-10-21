import { union, string, number } from '../src'

import { runExample } from './run-example'

const animal = union(
  { type: 'dog', foo: string, age: number },
  { type: 'cat', bar: string, age: number },
)

const a = {
  type: 'bird',
  name: 'tweety',
  age: 5
}

runExample(animal, a)
