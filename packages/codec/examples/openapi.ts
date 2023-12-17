import Ajv from 'ajv'

import { int, object, optional, rest, string, tstring, union } from '../src'
import { jsonSchema } from '../src/openapi'

const address = {
  street: string,
  city: string,
  state: string,
  postal: tstring(int, union(tstring('-', int), ''))
}

const person = {
  name: string,
  age: optional(int),
  addresses: [address, rest(address)],
  data: object
}

const js = jsonSchema(person)
console.log(JSON.stringify(js, null, ' '))

const a = new Ajv()
a.validateSchema(js)
