import { Effect, Fx, fx, ok } from '../fx'
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
  data: Record<string, unknown> | undefined,
  context?: Record<string, unknown> | undefined
}

export class Log extends Effect('fx/Log/Log')<LogMessage, void> {}

const log = (m: LogMessage) => new Log(m).send()

export const console = <const E, const A>(f: Fx<E, A>) => handle(f)
  .on(Log, ({ level, msg, data, context }) => fx(function* () {
    const t = yield* now
    const c = globalThis.console
    switch (level) {
      case Level.debug: return resume(c.debug(new Date(t), 'DEBUG', msg, { ...data, ...context }))
      case Level.warn: return resume(c.warn(new Date(t), 'WARN ', msg, { ...data, ...context }))
      case Level.error: return resume(c.error(new Date(t), 'ERROR', msg, { ...data, ...context }))
      default: return resume(c.info(new Date(t), 'INFO ', msg, { ...data, ...context }))
    }
  }))
  .return()

export const collect = <const E, const A>(f: Fx<E, A>) => handle(f)
  .initially(ok([] as readonly Readonly<{ time: number, msg: LogMessage }>[]))
  .on(Log, (message, l) => fx(function* () {
    return resume(undefined, [...l, { time: yield* now, msg: message }] as const)
  }))
  .return((r, l) => [r, l] as const)

export const minLevel = (min: Level) => <const E, const A>(f: Fx<E, A>) => handle(f)
  .on(Log, (message) => fx(function* () {
    return resume(message.level >= min ? yield* log(message) : undefined)
  }))
  .return()

export const context = (context: Record<string, unknown>) => <const E, const A>(f: Fx<E, A>) => handle(f)
  .on(Log, (message) => fx(function* () {
    return resume(yield* log({ ...message, context: { ...message.context, ...context } }))
  }))
  .return()

export const debug = (msg: string, data?: Record<string, unknown>) => log({ level: Level.debug, msg, data })
export const info = (msg: string, data?: Record<string, unknown>) => log({ level: Level.info, msg, data })
export const warn = (msg: string, data?: Record<string, unknown>) => log({ level: Level.error, msg, data })
export const error = (msg: string, data?: Record<string, unknown>) => log({ level: Level.warn, msg, data })
