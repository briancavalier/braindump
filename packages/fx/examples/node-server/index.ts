import { IncomingMessage, Server, ServerResponse, createServer } from 'http'

import { Async, Effect, Env, Fail, Fork, Fx, Handler, Log, Run, Time, fx, ok, sync } from '../../src'

// ----------------------------------------------------------------------
// #region Resource effect to acquire and release resources within a scope
class Acquire<E> extends Effect('Resource/AcquireRelease')<Readonly<{ acquire: Fx<E, unknown>, release: (...a: any[]) => Fx<E, unknown> }>> {}

const acquire = <const R, const E1, const E2>(acquire: Fx<E1, R>, release: (r: R) => Fx<E2, void>) =>
  new Acquire<E1 | E2>({ acquire, release }).send<R>()

const bracket = <const A, const R, const E1, const E2, const E3>(acq: Fx<E1, R>, rel: (r: R) => Fx<E2, void>, use: (r: R) => Fx<E3, A>) =>
  scope(fx(function* () {
    return yield* use(yield* acquire(acq, rel))
  }))

// Handler to scope resource allocation/release
const scope = <const E, const A>(f: Fx<E, A>) => Handler.control(f, [Acquire], {
  initially: ok([] as readonly Fx<unknown, unknown>[]),
  handle: (ar, resources) => fx(function* () {
    const { acquire, release } = ar.arg
    const a = yield* acquire
    return Handler.resume(a, [release(a), ...resources])
  }),
  finally: resources => fx(function* () {
    for (const release of resources) yield* release
  })
}) as Fx<ExcludeResources<E>, A>

type ExcludeResources<Effect> = Effect extends Acquire<infer E> ? E : Effect
// #endregion

// ----------------------------------------------------------------------
// #region Run a server, using the provided handler to process requests
const serve = <E, A>(
  handle: (req: IncomingMessage, res: ServerResponse) => Fx<E, A>
) =>
  bracket(fx(function* () {
      const { port } = yield* Env.get<{ port: number }>()
      return createServer().listen(port)
    }),
    (server) => sync(() => void server.close()),
    (server) => fx(function* () {

      let error: Error | undefined
      server.once('error', e => error = e)

      const close = () => server.close()

      while (!error) {
        const { request, response } = yield* Async.run((signal) => {
          signal.addEventListener('abort', close)
          return nextRequest(server)
        })
        if (error) break
        yield* Fork.fork(handle(request, response))
      }

      if (error) yield* Fail.fail(error)
    })
  )

const nextRequest = (server: Server) =>
  new Promise<{ request: IncomingMessage, response: ServerResponse }>((resolve) =>
    server.once("request", (request, response) =>
      resolve({ request, response })))
// #endregion

// ----------------------------------------------------------------------
// #region Define the handler for requests
const myHandler = (req: IncomingMessage, res: ServerResponse) => fx(function* () {
  yield* Log.info(`Received request`, { method: req.method, url: req.url })
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`ok`)
})
// #endregion

// ----------------------------------------------------------------------
// #region Run the server
const { port = 3000 } = process.env

const r = serve(myHandler).pipe(
  Env.provide({ port: +port }),
  Log.console,
  Time.builtinDate,
  scope,
  Fail.catchAll,
  Run.async
)

r.promise.then(console.log)

// setTimeout(() => r[Symbol.dispose](), 1000)
// #endregion
