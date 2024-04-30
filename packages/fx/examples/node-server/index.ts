
import { Env, Fail, Log, Resource, Run, Time, fx } from '../../src'

import { Connection, serve } from './serve'

// ----------------------------------------------------------------------
// Define the handler for requests
const myHandler = ({ request, response }: Connection) => fx(function* () {
  yield* Log.info(`Received request`, { method: request.method, url: request.url })
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end(`ok`)
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
