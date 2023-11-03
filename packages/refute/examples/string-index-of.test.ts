import assert from 'node:assert/strict'
import { test } from 'node:test'

import { all, string, tuple } from '../src'

test('b is a substring of a + b + c', () => {
  const strings = tuple(string, string, string)

  for(const [a, b, c] of all(strings))
    assert((a + b + c).indexOf(b) >= 0)
})
