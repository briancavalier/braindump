import { Effect, Fx, ok } from './fx'
import { handle, resume } from './handler'
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

export class Log extends Effect('fx/Log.Log')<LogMessage, void> {}

const log = (m: LogMessage) => new Log(m).send()

export const console = <const E, const A>(f: Fx<E, A>) => handle(f, [Log], {
  *handle(e) {
    const t = yield* now
    const { level, msg, data, context } = e.arg
    const c = globalThis.console
    switch (level) {
      case Level.debug: return resume(c.debug(new Date(t), 'DEBUG', msg, { ...data, ...context }))
      case Level.warn: return resume(c.warn(new Date(t), 'WARN ', msg, { ...data, ...context }))
      case Level.error: return resume(c.error(new Date(t), 'ERROR', msg, { ...data, ...context }))
      default: return resume(c.info(new Date(t), 'INFO ', msg, { ...data, ...context }))
    }
  }
})

export const collect = <const E, const A>(f: Fx<E, A>) => handle(f, [Log], {
  initially: ok([] as readonly Readonly<{ time: number, msg: LogMessage }>[]),
  *handle(e, l) {
    return resume(undefined, [...l, { time: yield* now, msg: e.arg }] as const)
  },
  return: (r, l) => [r, l]
})

export const silent = <const E, const A>(f: Fx<E, A>) => minLevel(f, Level.silent)

export const minLevel = <const E, const A>(f: Fx<E, A>, min: Level) => handle(f, [Log], {
  *handle(e) {
    return resume(e.arg.level >= min ? yield* log(e.arg) : undefined)
  }
})

export const context = <const E, const A>(f: Fx<E, A>, context?: Record<string, unknown>) => handle(f, [Log], {
  *handle(e) {
    return resume(yield* log({ ...e.arg, context: { ...e.arg.context, ...context } }))
  }
})

export const debug = (msg: string, data?: Record<string, unknown>) => log({ level: Level.debug, msg, data })
export const info = (msg: string, data?: Record<string, unknown>) => log({ level: Level.info, msg, data })
export const warn = (msg: string, data?: Record<string, unknown>) => log({ level: Level.error, msg, data })
export const error = (msg: string, data?: Record<string, unknown>) => log({ level: Level.warn, msg, data })
