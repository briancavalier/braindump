import { Effect, Fx, ok } from './fx'
import { handle } from './handler'
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

class Log extends Effect('Log')<LogMessage> { }

const log = (m: LogMessage) => new Log(m).request<void>()

export const console = <const E, const A>(f: Fx<E, A>) => handle(f, { Log }, {
  *handle(e) {
    const t = yield* now
    const { level, msg, data, context } = e.arg
    switch (level) {
      case Level.debug: return globalThis.console.debug(new Date(t), 'DEBUG', msg, { ...data, ...context })
      case Level.info: return globalThis.console.info(new Date(t), 'INFO ', msg, { ...data, ...context })
      case Level.warn: return globalThis.console.warn(new Date(t), 'WARN ', msg, { ...data, ...context })
      case Level.error: return globalThis.console.error(new Date(t), 'ERROR', msg, { ...data, ...context })
    }
  }
})

export const collect = <const E, const A>(f: Fx<E, A>) => handle(f, { Log }, {
  initially: ok([] as readonly Readonly<{ time: number, msg: LogMessage }>[]),
  handle: function* (e, l) { return [undefined, [...l, { time: yield* now, msg: e.arg }] as const] },
  return: (r, l) => [r, l]
})

export const silent = <const E, const A>(f: Fx<E, A>) => minLevel(f, Level.silent)

export const minLevel = <const E, const A>(f: Fx<E, A>, min: Level) => handle(f, { Log }, {
  *handle(e) {
    return e.arg.level >= min ? yield* e : undefined
  }
})

export const context = <const E, const A>(f: Fx<E, A>, context?: Record<string, unknown>) => handle(f, { Log }, {
  *handle(e) {
    return yield* log({ ...e.arg, context: { ...e.arg.context, ...context } })
  }
})

export const debug = (msg: string, data?: Record<string, unknown>) => log({ level: Level.debug, msg, data })
export const info = (msg: string, data?: Record<string, unknown>) => log({ level: Level.info, msg, data })
export const warn = (msg: string, data?: Record<string, unknown>) => log({ level: Level.error, msg, data })
export const error = (msg: string, data?: Record<string, unknown>) => log({ level: Level.warn, msg, data })
