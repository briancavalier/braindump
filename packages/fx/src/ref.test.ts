import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setTimeout } from 'node:timers/promises'

import { run, wait } from './effects/async'
import { all } from './effects/fork/fork'
import { fx, ok } from './fx'
import { SRef } from './ref'
import * as Run from './run'

describe('SRef', () => {
  describe('get', () => {
    it('returns current value', async () => {
      const expected = Math.random()
      const ref = new SRef(expected)
      const actual = Run.async(ref.get())
      assert.equal(await actual.promise, expected)
    })
  })

  describe('update', () => {
    it('get after update returns updated value', async () => {
      const current = Math.random()
      const expected = current + 1
      const ref = new SRef(current)
      const actual = Run.async(ref.update(() => ok(expected)))
      assert.equal(await actual.promise, expected)
    })

    it('performs updates sequentially', async () => {
      const ref = new SRef([] as readonly number[])
      const expected = Array.from({ length: 10 }, (_, i) => i)

      const result = Run.async(fx(function* () {
        const updates = expected.map(i => ref.update(x => fx(function* () {
          yield* delay(expected.length - i)
          return [...x, i]
        })))
        yield* wait(yield* all(...updates))
        return yield* ref.get()
      }))

      assert.deepEqual(await result.promise, expected)
    })
  })
})

const delay = (ms: number) => run(
  signal => setTimeout(ms, undefined, { signal })
)
