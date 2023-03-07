import { ok } from 'node:assert/strict'

import { describe, it } from 'node:test'

import { empty, isEmpty } from '.'

describe(isEmpty.name, () => {
  it('returns true for empty', () => {
    ok(isEmpty(empty))
  })
})
