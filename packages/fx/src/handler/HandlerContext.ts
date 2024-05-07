import { Fx } from '../fx'
import { Continue } from './Continue'


export interface HandlerContext extends Fx<unknown, unknown> {
  readonly forkable: boolean
  readonly handlers: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, Continue<unknown, unknown>>>
}
