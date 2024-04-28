import { IncomingMessage, ServerResponse } from 'http'

import { Env, Fail, Log, Run, Time, fx } from '../../src'
import { scope } from '../../src/effects/resource'

import { serve } from './serve'

// ----------------------------------------------------------------------
// Define the handler for requests
const myHandler = (req: IncomingMessage, res: ServerResponse) => fx(function* () {
  yield* Log.info(`Received request`, { method: req.method, url: req.url })
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`ok`)
})
// #endregion

// ----------------------------------------------------------------------
// #region Run the server
const { port = 3000 } = process.env

serve(myHandler).pipe(
  Env.provide({ port: +port }),
  Log.console,
  Time.builtinDate,
  scope,
  Fail.catchAll,
  Run.async
).promise.then(console.log, console.error)

// setTimeout(() => r[Symbol.dispose](), 1000)
// #endregion
