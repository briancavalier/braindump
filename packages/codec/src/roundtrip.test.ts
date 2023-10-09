import assert from 'node:assert/strict'
import { test } from 'node:test'

import { AnyBoolean, AnyNumber, AnyString, assertOk, boolean, decode, encode, enumOf, number, schema, string } from '.'

test('roundtripping', async t => {
  await t.test('number', () => {
    roundtripWith(number, 0)
    roundtripWith(number, 1)
    roundtripWith(number, -1)
    roundtrip(number)
  })

  await t.test('string', () => roundtrip(string))

  await t.test('boolean', () => {
    roundtripWith(boolean, true)
    roundtripWith(boolean, false)
  })

  await t.test('enum', () => {
    enum T { a = Math.random(), b = Math.random() }
    roundtripWith(enumOf(T), T.a)
    roundtripWith(enumOf(T), T.b)
  })
})

const roundtripWith = (s: any, x: unknown) => {
  const d1 = assertOk(decode(s)(x))
  const e1 = assertOk(encode(s)(d1))
  const d2 = assertOk(decode(s)(e1))
  const e2 = assertOk(encode(s)(d2))

  assert.deepEqual(d1, d2)
  assert.deepEqual(e1, e2)
}

const roundtrip = (s: any) => roundtripWith(s, arb(s))

// TODO: use fast-check arbitraries?
const arb = <const S extends AnyNumber | AnyString | AnyBoolean>(s: S) => {
  switch(s[schema]) {
    case 'number': return 1000 * Math.random()
    case 'string': return `${Math.random()}`
    case 'boolean': return Math.random() >= 0.5
  }
}
