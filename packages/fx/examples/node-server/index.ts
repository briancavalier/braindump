import { Env, Fail, Log, Resource, Run, Time, fx } from '../../src'

import { Connection, runServer } from './HttpServer'

// ----------------------------------------------------------------------
// Define the handler for requests
const myHandler = ({ request, response }: Connection) => fx(function* () {
  yield* Log.info(`Handling request`, { method: request.method, url: request.url })

  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Hello, World!')
})

// ----------------------------------------------------------------------
// #region Run the server
const { port = 3000 } = process.env

runServer(myHandler).pipe(
  Log.console,
  Time.builtinDate,
  Fail.catchAll,
  Resource.scope,
  Env.provide({ port: +port }),
  Run.async
)
