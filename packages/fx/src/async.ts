import { Effect } from './fx'

export class Async extends Effect('Wait')<(f: (x: any) => void) => Disposable> { }

export const async = <const A>(run: (f: (a: A) => void) => Disposable) => new Async(run).request<A>()
