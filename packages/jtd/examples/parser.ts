import Ajv from 'ajv/dist/jtd'

import { parser } from '../parser'
import { Parsed } from '../schema'

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

const ajv = new Ajv()
const personParser = parser(ajv, person)

const maybePerson = JSON.stringify({
  name: 'Dennis',
  age: 37,
  addresses: [{
    street: "123 foo st.",
    city: "Pittsburgh",
    state: "PA",
    zip: "12345"
  }]
})

const result = personParser.parse(maybePerson)

console.log(result)
if(result.ok) {
  console.log(personParser.unparse(result.value))
  // Unparsing strips removes properties, unlike JSON.stringify
  console.log(personParser.unparse({ ...result.value, extraProperty: 'will be removed by unparse' } ))

  // Type error. Values not corresponding to the parser's schema are disallowed
  // console.log(personParser.unparse({}))
}
