import { inspect } from 'node:util'

import { Log, Run, Time, fx } from '../src'

const f1 = fx(function* () {
  yield* Log.debug('this is debug', { debug: 123 })
  yield* Log.info('Hello, world!')
  yield* Log.warn('This is a warning!', { foo: 'bar' })
  yield* Log.error('This is an error!', { baz: 'qux' })
})

const main = fx(function* () {
  // return yield* f1
  return yield* Log.context(Log.minLevel(f1, Log.Level.info), { propFromParent: 'parent' })
})

const m1 = Log.context(main, { propFromTopLevel: 'top-level' })

// const m2 = Log.console(m1)
const m2 = Log.collect(m1)

const m3 = Time.builtinDate(m2)

const result = Run.sync(m3)

console.log(inspect(result, false, Infinity))
