import { Effect, Fx, fx, map } from '../fx'
import { handle, resume } from '../handler'

import { now } from './time'

export enum Level {
  debug = 1,
  info,
  warn,
  error,
  silent
}

export interface LogMessage {
  level: Level,
  msg: string,
  data?: Record<string, unknown> | undefined,
  context?: Record<string, unknown> | undefined
}

export class Log extends Effect('fx/Log')<LogMessage, void> {}

export const log = (m: LogMessage) => new Log(m)

export const console = handle(Log, ({ level, msg, data, context }) => fx(function* () {
    const t = yield* now
    const c = globalThis.console
    switch (level) {
      case Level.debug: return resume(c.debug(new Date(t), 'DEBUG', msg, { ...data, ...context }))
      case Level.warn: return resume(c.warn(new Date(t), 'WARN ', msg, { ...data, ...context }))
      case Level.error: return resume(c.error(new Date(t), 'ERROR', msg, { ...data, ...context }))
      default: return resume(c.info(new Date(t), 'INFO ', msg, { ...data, ...context }))
    }
  }))

export const collect = <const E, const A>(f: Fx<E, A>) => fx(function* () {
  const log = [] as Readonly<{ time: number, msg: LogMessage }>[]
  return yield* f.pipe(
    handle(Log, message => fx(function* () {
      log.push({ time: yield* now, msg: message })
      return resume(undefined)
    })),
    x => x,
    map(a => [a, log])
  )
})

export const minLevel = (min: Level) =>
  handle(Log, message => fx(function* () {
    return resume(message.level >= min ? yield* log(message) : undefined)
  }))

export const context = (context: Record<string, unknown>) =>
  handle(Log, message => fx(function* () {
    return resume(yield* log({ ...message, context: { ...message.context, ...context } }))
  }))

export const debug = (msg: string, data?: Record<string, unknown>) => log({ level: Level.debug, msg, data })
export const info = (msg: string, data?: Record<string, unknown>) => log({ level: Level.info, msg, data })
export const warn = (msg: string, data?: Record<string, unknown>) => log({ level: Level.error, msg, data })
export const error = (msg: string, data?: Record<string, unknown>) => log({ level: Level.warn, msg, data })
