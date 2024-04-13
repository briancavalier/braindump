import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { get, provide, provideAll } from './env'
import { fx } from './fx'
import { run } from './runtime/sync'

describe('Env', () => {
  describe('get', () => {
    it('given environment, returns requested items', () => {
      const f = get<{ x: number, y: string }>()
      const expected = { x: Math.random(), y: `${Math.random()}` }
      const result = run(provideAll(expected, f))
      assert.equal(result, expected)
    })

    it('given environment, returns requested item subset', () => {
      const f = get<{ x: number }>()
      const expected = Math.random()
      const { x } = run(provideAll({ x: expected }, f))
      assert.equal(x, expected)
    })

    it('given environment, returns same items one-at-time vs all-at-once', () => {
      const f = fx(function* () {
        return [
          yield* get<{ x: number, y: string }>(),
          yield* get<{ x: number }>(),
          yield* get<{ y: string }>()
        ]
      })

      const expected = { x: Math.random(), y: `${Math.random()}` }
      const [xy, { x }, { y }] = run(provideAll(expected, f))

      assert.deepEqual(xy, { x, y })
    })
  })

  describe('provide', () => {
    it('given incomplete environment, is type error', () => {
      const f = get<{ x: number, y: string }>()
      // @ts-expect-error y is missing
      provideAll({ x: 1 }, f)
    })

    it('given nested environment, returns nearest items', () => {
      const f = get<{ x: number, y: string }>()
      const x = Math.random()
      const y = `${Math.random()}`

      const result = run(provide({ x, y: '' }, provide({ y }, f)))

      assert.equal(result.x, x)
      assert.equal(result.y, y)
    })
  })
})
