import Ajv from 'ajv/dist/jtd'
import { AjvParser, Parsed } from '../index'

const address = {
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' }
  }
} as const

const person = {
  properties: {
    name: { type: 'string' },
    age: { type: 'uint8' }
  },
  optionalProperties: {
    addresses: { elements: address }
  }
} as const

type Person = Parsed<typeof person>

const maybePerson = {
  name: 'Dennis',
  age: 37,
  addresses: [{
    street: "123 foo st.",
    city: "Pittsburgh",
    state: "PA",
    zip: "12345"
  }]
}

const ajv = new Ajv()
const parser = new AjvParser(ajv)
const result1 = parser.parse(person, JSON.stringify(maybePerson))

console.log(result1)
if (result1.ok) {
  console.log(parser.serialize(person, result1.value))
  // Unparsing removes unknown properties, unlike JSON.stringify
  console.log(parser.serialize(person, { ...result1.value, extraProperty: 'will be removed by serialize' }))
}

const result2 = parser.parse(person, JSON.stringify({
  ...maybePerson,
  extraProperty: 'will be removed by parse',
}))

console.log(result2)
if (result2.ok) {
  console.log(parser.serialize(person, result2.value), ajv.validate(person, result2.value), ajv.errors)
}

// @ts-expect-error value must be of type Person
console.log(parser.serialize(person, {}))
