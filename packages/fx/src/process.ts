import { Fx } from './fx'

export type Process<Dispose, A> = {
  readonly dispose: Fx<Dispose, void>,
  readonly promise: Promise<A>
}

// export const all = <Fibers extends readonly Process<unknown, unknown>[]>(...fibers: Fibers) =>
//   ({
//     dispose: fx(function* () {
//       for (const f of fibers) yield* f.dispose
//     }),
//     promise: Promise.all(fibers.map(f => f.promise))
//   }) as Process<
//     Effects<Fibers[number]["dispose"]>,
//     { readonly [K in keyof Fibers]: Awaited<Fibers[K]["promise"]> }
//   >
