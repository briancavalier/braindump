import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import { decoded } from './fast-check'

import { Decoded, Schema, array, arrayOf, assertOk, bigint, boolean, decode, encode, enumOf, float, int, number, object, optional, record, string, tstring, union, unknown } from '.'

test('roundtripping', async t => {
  await t.test('unknown', () =>
    roundtrip(unknown))

  await t.test('literal', () => {
    fc.assert(fc.property(fc.float(), roundtrip))
    fc.assert(fc.property(fc.string(), roundtrip))
    fc.assert(fc.property(fc.boolean(), roundtrip))
  })

  await t.test('number', () =>
    roundtrip(number))

  await t.test('bigint', () =>
    roundtrip(bigint))

  await t.test('int', () =>
    roundtrip(int))

  await t.test('float', () =>
    roundtrip(float))

  await t.test('string', () =>
    roundtrip(string))

  await t.test('boolean', () =>
    roundtrip(boolean))

  await t.test('object', () =>
    roundtrip(object))

  await t.test('array', () =>
    roundtrip(array))

  await t.test('enum (enum)', () => {
    enum T { a, b }
    roundtrip(enumOf(T))
  })

  await t.test('enum (object literal)', () =>
    fc.assert(fc.property(fc.record({
      a: fc.float(),
      b: fc.float()
    }), (e) =>
      roundtrip(enumOf(e)))))

  await t.test('union', () =>
    roundtrip(union(number, string)))

  await t.test('array-of', () =>
    roundtrip(arrayOf(number)))

  await t.test('record', () =>
    roundtrip(record(string, number)))

  await t.test('tuple', () =>
    roundtrip([number, { a: string }, boolean]))

  await t.test('properties', () =>
    roundtrip({
      a: string,
      b: optional(number),
      c: {
        d: string,
      }
    }))

  await t.test('template-literal', () =>
    roundtrip(tstring('hello ', string, ', this is ', number, ', ', 1, ', ', boolean, ', ', true, ', ', false, ', ', bigint, ', ', 123n, ', ', int)))
})

const roundtrip = <const S extends Schema>(s: S) =>
  fc.assert(fc.property(decoded(s), x => roundtripWith(s, x)))

const roundtripWith = <const S extends Schema>(s: S, d: Decoded<S>) => {
  const enc = encode(s)
  const dec = decode(s)

  // @ts-expect-error infinite
  const e1 = assertOk(enc(d))
  const d1 = assertOk(dec(e1))
  const e2 = assertOk(enc(d1))
  const d2 = assertOk(dec(e2))

  assert.deepEqual(e1, e2)
  assert.deepEqual(d1, d2)
}
