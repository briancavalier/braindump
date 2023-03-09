## Adhoc schemas

Ad hoc schemas are "zero API" schemas based on a simple premise: every value composed of primitive values, objects, and arrays is a schema for itself.

For example:

```ts
import { decode, encode } from '@braindump/schema'

const s = {
  name: 'Alice'
}

// Use s as a schema to decode s
const decodeResult = decode(s)(s)

// { tag: 'ok', value: { name: 'Alice' } }
console.log(decodeResult)

// or to encode s
const encodeResult = encode(s)(s)

// { tag: 'ok', value: { name: 'Alice' } }
console.log(encodeResult)
```

Consequently, literal values, objects, and tuples don't require an API to construct.  This leads to some interesting and natural ways of working with schemas.

They are _ad hoc_.

### Creating schemas

Ad hoc schemas can be mixed freely with other schemas that do require an API to construct, such as primitives, unions, arrays, and mappings.  For example:

```ts
import { decode, number } from '@braindump/schema'

const addressSchema = {
  street: string,
  city: string
}

const s = {
  name: 'Alice',
  age: number,
  address: addressSchema
}

// Use s as a schema to decode s
const result = decode(s)({
  name: 'Alice',
  age: 42,
  address: {
    street: '123 The Street',
    city: 'Pittsburgh'
  }
})

// {
//   tag: 'ok',
//   value: {
//     name: 'Alice',
//     age: 42,
//     address: { street: '123 The Street', city: 'Pittsburgh' }
//   }
// }
console.log(result)
```

### Composing and decomposing ad hoc schemas

Ad hoc schemas compose and decompose in a natural way using plain old object spread and rest.

```ts
import { decode } from '@braindump/schema'

const personSchema = {
  name: string
}

const personWithAgeSchema = {
  ...personSchema,
  age: number
}

const result = decode(personWithAgeSchema)({
  name: 'Alice',
  age: 42
})

// { tag: 'ok', value: { name: 'Alice', age: 42 } }
console.log(result)
```

### Ad hoc discriminated unions

Ad hoc literals can be used to create a discriminated union schemas in a simple way.  For example, these types:

```ts
// From: https://github.com/Effect-TS/schema#discriminated-unions

type Circle = {
  readonly kind: 'circle',
  readonly radius: number
}

type Square = {
  readonly kind: 'square',
  readonly sideLength: number
}

type Shape = Circle | Square
```

can be recreated using ad hoc schemas in an obvious way:

```ts
import { number, union } from '@braindump/schema'

// From: https://github.com/Effect-TS/schema#discriminated-unions

const circleSchema = {
  kind: 'circle',
  radius: number
}

const squareSchema = {
  kind: 'square'
  sideLength: number
}

const shapeSchema = union(circleSchema, squareSchema)

// Same as Circle | Square from above
type Shape = Infer<typeof shapeSchema>
```

## Inspiration

* [My earlier implementation of ad hoc schemas](https://github.com/briancavalier/decode)
* [Effect-TS/schema](https://github.com/Effect-TS/schema)
