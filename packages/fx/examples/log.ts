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
  return yield* f1.pipe(Log.context({ propFromParent: 'parent' }), Log.minLevel(Log.Level.info))
})

const result = main.pipe(
  Log.context({ propFromTopLevel: 'top-level' }),
  Log.collect,
  // Log.console,
  Time.builtinDate,
  Run.sync
)

console.log(inspect(result, false, Infinity))
