import { ok } from 'node:assert/strict'

import * as F from 'fast-check'
import { test } from 'node:test'

import { difference, empty, equal, has, ImmutableSet, intersection, isEmpty, of, union } from '.'

/**
 * Arbitrary ImmutableSet
 */
const immutableSet = <A>(a: F.Arbitrary<A>): F.Arbitrary<ImmutableSet<A>> =>
  F.array(a).map((elements) => of(...elements))

test('empty isEmpty', () => {
  ok(isEmpty(empty))
})

test(`has returns true forall x element of S`, () => {
  F.assert(
    F.property(F.array(F.anything()), F.anything(), F.array(F.anything()), (init, x, tail) =>
      ok(has(x, of(...[...init, x, ...tail]))),
    ),
  )
})

test(`has returns false for empty`, () => {
  F.assert(F.property(F.anything(), (x) => ok(!has(x, empty))))
})

test('equal is reflexive', () => {
  F.assert(F.property(immutableSet(F.anything()), (s) => ok(equal(s, s))))
})

test('of forall x has(x, of(x))', () => {
  F.assert(F.property(F.anything(), (x) => ok(has(x, of(x)))))
})

test('of given no arguments, is empty', () => {
  ok(isEmpty(of()))
})

test('of given no arguments, equal(empty, of())', () => {
  ok(equal(empty, of()))
})

test('union has empty identity', () => {
  F.assert(F.property(immutableSet(F.anything()), (s) => ok(equal(s, union(s, empty)))))
})

test('union is associative', () => {
  F.assert(
    F.property(
      immutableSet(F.anything()),
      immutableSet(F.anything()),
      immutableSet(F.anything()),
      (s1, s2, s3) => ok(equal(union(s1, union(s2, s3)), union(union(s1, s2), s3))),
    ),
  )
})

test('union is commutative', () => {
  F.assert(
    F.property(immutableSet(F.anything()), immutableSet(F.anything()), (s1, s2) =>
      ok(equal(union(s1, s2), union(s2, s1))),
    ),
  )
})

test('intersection has self identity', () => {
  F.assert(F.property(immutableSet(F.anything()), (s) => ok(equal(s, intersection(s, s)))))
})

test('intersection is associative', () => {
  F.assert(
    F.property(
      immutableSet(F.anything()),
      immutableSet(F.anything()),
      immutableSet(F.anything()),
      (s1, s2, s3) =>
        ok(equal(intersection(s1, intersection(s2, s3)), intersection(intersection(s1, s2), s3))),
    ),
  )
})

test('intersection is commutative', () => {
  F.assert(
    F.property(immutableSet(F.anything()), immutableSet(F.anything()), (s1, s2) =>
      ok(equal(intersection(s1, s2), intersection(s2, s1))),
    ),
  )
})

test('difference has empty identity', () => {
  F.assert(F.property(immutableSet(F.anything()), (s) => ok(equal(s, difference(s, empty)))))
})
