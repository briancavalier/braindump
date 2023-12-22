import Ajv from 'ajv'

import { int, object, optional, rest, string, tstring, union } from '../src'
import { decoded } from '../src/json-schema'

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
  status: union('active', 'inactive'),
  data: object
}

const js = decoded(person)
console.log(JSON.stringify(js, null, ' '))

const a = new Ajv()
a.validateSchema(js)
