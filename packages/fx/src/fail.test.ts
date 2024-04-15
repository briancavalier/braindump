import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { catchIf, fail } from './fail'
import { fx, of } from './fx'

import { runSync } from '.'

describe('Fail', () => {
  describe('catchIf', () => {
    it('given no failures, returns result', () => {
      const expected = Math.random()
      const f = of(expected)

      const actual = runSync(catchIf((x): x is unknown => true, f))
      assert.equal(actual, expected)
    })

    it('given non-matching failure, return neither result nor failure', () => {
      const unexpected = Math.random()
      const f = fx(function* () {
        yield* fail(unexpected)
        return unexpected
      })

      // @ts-expect-error failure is not handled
      const result = runSync(catchIf((x): x is string => typeof x === 'string', f))
      assert.notEqual(result, unexpected)
    })


    it('given matching failure, returns failure', () => {
      const result = Math.random()
      const expected = 1 + result
      const f = fx(function* () {
        yield* fail(expected)
        return result
      })

      const actual = runSync(catchIf((x): x is number => typeof x === 'number', f))
      assert.equal(actual, expected)
    })
  })

})
