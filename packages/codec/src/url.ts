import { attempt } from './attempt'
import { ok } from './result'
import { codec, pipe, string } from './schema'

export const url = pipe(string, codec(
  attempt((s: string) => new URL(s)),
  (u: URL) => ok(u.toString())
))
