import { IncomingMessage, Server, ServerResponse, createServer } from 'http'

import { Async, Env, Fail, Fork, Fx, Resource, fx, sync } from '../../src'

// ----------------------------------------------------------------------
// Run a server, using the provided handler to process requests
// TODO: Refine and add to a package?

export type Connection = { request: IncomingMessage; response: ServerResponse }

export const serve = <E, A>(
  handle: (c: Connection) => Fx<E, A>
) => Resource.bracket(
  fx(function* () {
    const { port } = yield* Env.get<{ port: number} >()
    return createServer().listen(port)
  }),
  (server) => sync(() => {
    console.log('close server')
    server.close()
  }),
  (server) => fx(function* () {
    // TODO: What is the right way to handle errors and other events?
    let error: Error | undefined
    server.once('error', e => error = e)

    const close = () => server.close()

    while (!error) {
      const connection = yield* Async.run((signal) => {
        signal.addEventListener('abort', close)
        return nextRequest(server)
      })

      if (error) break
      yield* Fork.fork(handle(connection))
    }

    if (error) yield* Fail.fail(error)
  })
)

const nextRequest = (server: Server) =>
  new Promise<{ request: IncomingMessage; response: ServerResponse}>((resolve) =>
    server.once("request", (request, response) =>
      resolve({ request, response })))
