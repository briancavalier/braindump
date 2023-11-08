import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import { arbitraryDecoded } from './fast-check'

import { Decoded, Schema, array, arrayOf, assertOk, bigint, boolean, decode, encode, enumOf, number, object, optional, record, string, union } from '.'

test('roundtripping', async t => {
  await t.test('literal', () => {
    fc.assert(fc.property(fc.float(), roundtrip))
    fc.assert(fc.property(fc.string(), roundtrip))
    fc.assert(fc.property(fc.boolean(), roundtrip))
  })

  await t.test('number', () => {
    roundtripWith(number, 0)
    roundtripWith(number, 1)
    roundtripWith(number, -1)
    roundtrip(number)
  })

  await t.test('bigint', () => {
    roundtripWith(bigint, 0n)
    roundtripWith(bigint, 1n)
    roundtripWith(bigint, -1n)
    roundtrip(bigint)
  })

  await t.test('string', () =>
    roundtrip(string))

  await t.test('boolean', () => {
    roundtripWith(boolean, true)
    roundtripWith(boolean, false)
  })

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

  await t.test('arrayOf', () =>
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
})

const roundtrip = <const S extends Schema>(s: S) =>
  fc.assert(fc.property(arbitraryDecoded(s), x => roundtripWith(s, x)))

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
