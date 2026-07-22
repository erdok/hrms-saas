/**
 * Structured logger (pino-style) without the pino runtime dependency.
 *
 * Levels:
 *   debug | info | warn | error | fatal
 *
 * Output is JSON in production, pretty in dev.
 */

type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 60,
}

const runtimeLevel: Level = (process.env.LOG_LEVEL as Level) ?? 'info'
const isDev = process.env.NODE_ENV !== 'production'

interface LogContext {
  requestId?: string
  companyId?: string
  actorId?: string
  [key: string]: unknown
}

class Logger {
  context: LogContext = {}

  with(ctx: LogContext): Logger {
    const child = new Logger()
    child.context = { ...this.context, ...ctx }
    return child
  }

  debug(msg: string, ctx: LogContext = {}) {
    this.emit('debug', msg, ctx)
  }

  info(msg: string, ctx: LogContext = {}) {
    this.emit('info', msg, ctx)
  }

  warn(msg: string, ctx: LogContext = {}) {
    this.emit('warn', msg, ctx)
  }

  error(msg: string, ctx: LogContext = {}): void {
    this.emit('error', msg, ctx)
  }

  fatal(msg: string, ctx: LogContext = {}) {
    this.emit('fatal', msg, ctx)
    // In a real deployment: this probably should crash the process.
  }

  private emit(level: Level, msg: string, ctx: LogContext) {
    if (LEVELS[level] < LEVELS[runtimeLevel]) return

    const line = {
      time: new Date().toISOString(),
      level,
      msg,
      ...this.context,
      ...ctx,
    }

    if (isDev) {
      const color = {
        debug: '\x1b[34m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        fatal: '\x1b[35m',
      }[level]
      const reset = '\x1b[0m'
      // eslint-disable-next-line no-console
      console.log(`${color}[${level}]${reset} ${msg}`, { ...this.context, ...ctx })
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(line))
    }
  }
}

export const logger = new Logger()
export type { Logger, LogContext }
