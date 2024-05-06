import { IncomingMessage, Server, ServerResponse, createServer } from 'http'

import { Async, Effect, Env, Fork, Fx, Handler, Log, fx, ok } from '../../src'

//----------------------------------------------------------------------
// Http Server example
// This shows the flexibility of handlers.  We can implement an http
// server as a handler.  This implementation ignores errors and other
// details, but it's a good example of what handlers are capable of.

// #region Http Server effect to get the next incoming request

class NextRequest extends Effect<'HttpServer', void, Connection> { }

export const nextRequest = new NextRequest()

export type Connection = Readonly<{ request: IncomingMessage; response: ServerResponse }>

// #endregion
// ----------------------------------------------------------------------
// #region Node Http Server handler
// Runs a node server as a handler, with initially/finally to manage
// the server lifecycle

export const serveNode = <E, A>(f: Fx<E, A>) => Handler
  .initially(fx(function* () {
    const { port } = yield* Env.get<{ port: number }>()
    return createServer().listen(port)
  }))
  .finally(
    server => ok(void server.close())
  )
  .on(NextRequest, (_, server) => fx(function* () {
    const close = () => server.close()

    const connection = yield* Async.run((signal) => {
      signal.addEventListener('abort', close, { once: true })
      return getNextRequest(server)
        .finally(() => signal.removeEventListener('abort', close))
    })

    return Handler.resume(connection, server)
  }))
  .handle(f)

export const runServer = <E, A>(
  handle: (c: Connection) => Fx<E, A>
) => serveNode(fx(function* () {
  while(true) {
    const next = yield* nextRequest
    yield* Fork.fork(Handler
      .initially(Log.info(`Received ${next.request.method} ${next.request.url}`, { headers: next.request.headers }))
      .finally(() => Log.info(`Handled ${next.request.method} ${next.request.url} ${next.response.statusCode}`, next.response.getHeaders()))
      .handle(handle(next)))
  }
}))

const getNextRequest = (server: Server) =>
  new Promise<{ request: IncomingMessage; response: ServerResponse}>((resolve) =>
    server.once("request", (request, response) =>
      resolve({ request, response })))

// #endregion
