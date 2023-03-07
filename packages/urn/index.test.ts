import assert from 'node:assert/strict'

import { describe, it } from 'node:test'

import { equivalent, parse, unparse } from '.'

describe(parse.name, () => {
  it('returns undefined for invalid scheme', () => {
    assert.equal(parse('urx:example:a123,z456'), undefined)
  })
})

describe(`${parse.name} and ${unparse.name}`, () => {
  it('are inverses by equivalence', () => {
    const u = [
      parse('urn:example:a123,z456'),
      parse('URN:example:a123,z456'),
      parse('urn:EXAMPLE:a123,z456'),
      parse('urn:example:a123,z456?+abc'),
      parse('urn:example:a123,z456?=xyz'),
      parse('urn:example:a123,z456#789'),
      parse('urn:example:a123%2Cz456'),
      parse('urn:example:a123%2Cz456'),
      parse('urn:example:A123,z456'),
      parse('urn:example:a123,Z456'),
      parse('urn:example:%D0%B0123,z456'),
    ]

    u.forEach((u) => assert(equivalent(u, parse(unparse(u)))))
  })
})

// From:
// https://www.rfc-editor.org/rfc/rfc8141#section-3.2
describe(equivalent.name, () => {
  it('has case-insensitive schema and NID', () => {
    const u1 = parse('urn:example:a123,z456')
    const u2 = parse('URN:example:a123,z456')
    const u3 = parse('urn:EXAMPLE:a123,z456')

    assert(equivalent(u1, u2))
    assert(equivalent(u1, u3))
    assert(equivalent(u2, u3))
  })

  it('ignores r, q, and f components', () => {
    const u1 = parse('urn:example:a123,z456?+abc')
    const u2 = parse('urn:example:a123,z456?=xyz')
    const u3 = parse('urn:example:a123,z456#789')

    assert(equivalent(u1, u2))
    assert(equivalent(u1, u3))
    assert(equivalent(u2, u3))
  })

  it('considers slash components', () => {
    const u1 = parse('urn:example:a123,z456/foo')
    const u2 = parse('urn:example:a123,z456?=xyz')
    const u3 = parse('urn:example:a123,z456/baz')

    assert(!equivalent(u1, u2))
    assert(!equivalent(u1, u3))
    assert(!equivalent(u2, u3))
  })

  it('has case-insensitive NSS percent encoding', () => {
    const u = [
      parse('urn:example:a123,z456'),
      parse('URN:example:a123,z456'),
      parse('urn:EXAMPLE:a123,z456'),
    ]

    const u1 = parse('urn:example:a123%2Cz456')
    const u2 = parse('urn:example:a123%2Cz456')

    assert(equivalent(u1, u2))

    u.forEach((u) => assert(!equivalent(u, u1)))
    u.forEach((u) => assert(!equivalent(u, u2)))
  })

  it('has case-sensitive NSS', () => {
    const u1 = parse('urn:example:A123,z456')
    const u2 = parse('urn:example:a123,Z456')

    assert(!equivalent(u1, u2))
  })

  it('considers extended charsets', () => {
    const u = [
      parse('urn:example:a123,z456'),
      parse('URN:example:a123,z456'),
      parse('urn:EXAMPLE:a123,z456'),
    ]

    const u1 = parse('urn:example:%D0%B0123,z456')

    u.forEach((u) => assert(!equivalent(u, u1)))
  })
})
