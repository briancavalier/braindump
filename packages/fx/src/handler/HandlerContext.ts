import { Fx } from '../fx'

import { Continue, Resume } from './Continue'

export interface HandlerContext extends Fx<unknown, unknown> {
  readonly handlers: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, Resume<unknown>>>
  readonly controls: ReadonlyMap<unknown, (e: unknown) => Fx<unknown, Continue<unknown, unknown>>>
}
