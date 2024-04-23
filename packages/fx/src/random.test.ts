import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MAX_INT, MIN_INT, float, int, xoroshiro128plus } from './random'
import * as Run from './run'

describe('Random', () => {
  describe('xoroshiro128plus', () => {
    describe('float', () => {
      it('given arbitrary seed, generates numbers in 0 <= n < 1', () => {
        // From https://github.com/dubzzz/pure-rand
        const result = Run.sync(xoroshiro128plus(Date.now() ^ (Math.random() * 0x100000000), float))
        assert.ok(result >= 0 && result < 1, `0 <= ${result} < 1`)
      })
    })

    describe('int', () => {
      it('given arbitrary seed, generates numbers in min <= n <= max', () => {
        const result = Run.sync(xoroshiro128plus(Date.now() ^ (Math.random() * 0x100000000), int(MIN_INT, MAX_INT)))
        assert.ok(result >= MIN_INT && result < MAX_INT, `${MIN_INT} <= ${result} <= ${MAX_INT}`)
      })
    })
  })
})
