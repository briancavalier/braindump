import { IncomingMessage, ServerResponse } from 'http'

import { Env, Fail, Log, Resource, Run, Time, fx } from '../../src'

import { serve } from './serve'

// ----------------------------------------------------------------------
// Define the handler for requests
const myHandler = (req: IncomingMessage, res: ServerResponse) => fx(function* () {
  yield* Log.info(`Received request`, { method: req.method, url: req.url })
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`ok`)
})

// ----------------------------------------------------------------------
// #region Run the server
const { port = 3000 } = process.env

serve(myHandler).pipe(
  Env.provide({ port: +port }),
  Log.console,
  Time.builtinDate,
  Resource.scope,
  Fail.catchAll,
  Run.async
)
