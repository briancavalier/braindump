import { IncomingMessage, Server, ServerResponse, createServer } from 'http'

import { Async, Effect, Env, Fail, Fork, Fx, Handler, Log, Run, Time, fx, ok, sync } from '../../src'

// ----------------------------------------------------------------------
// #region Resource effect to acquire and release resources within a scope
class AcquireRelease<E> extends Effect('Resource/AcquireRelease')<Readonly<{ acquire: Fx<E, unknown>, release: (...a: any[]) => Fx<E, unknown> }>> {}

const acquireRelease = <const A, const E1, const E2>(acquire: Fx<E1, A>, release: (a: A) => Fx<E2, void>) =>
  new AcquireRelease<E1 | E2>({ acquire, release }).send<A>()

// Handler to scope resource allocation/release
const withResources = <const E, const A>(f: Fx<E, A>) => Handler.control(f, [AcquireRelease], {
  initially: ok(new Map()),
  handle: (ar, resources) => fx(function* () {
    const { acquire, release } = ar.arg
    const a = yield* acquire
    return Handler.resume(a, resources.set(a, release))
  }),
  finally: resources => fx(function* () {
    for (const [a, release] of resources) yield* release(a)
  })
}) as Fx<ExcludeResources<E>, A>

type ExcludeResources<Effect> = Effect extends AcquireRelease<infer E> ? E : Effect
// #endregion

// ----------------------------------------------------------------------
// #region Run a server, using the provided handler to process requests
const serve = <E, A>(
  handle: (req: IncomingMessage, res: ServerResponse) => Fx<E, A>
) =>
  fx(function* () {
    const { port } = yield* Env.get<{ port: number }>()

    // Create the server and ensure it's closed when the program ends
    const server: Server = yield* acquireRelease(
      ok(createServer().listen(port)),
      (server) => {
        console.log('shutdown')
        return sync(() => void server.close())
      }
    )

    let error: Error | undefined
    server.once('error', e => error = e)

    const close = () => server.close()

    while (!error) {
      const { request, response } = yield* Async.run((signal) => {
        signal.addEventListener('abort', close)
        return nextRequest(server)
      })
      if(error) break
      yield* Fork.fork(handle(request, response))
    }

    if(error) yield* Fail.fail(error)
  })

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
  withResources,
  Fail.catchAll,
  Run.async
)

r.promise.then(console.log)

// setTimeout(() => r[Symbol.dispose](), 1000)
// #endregion
