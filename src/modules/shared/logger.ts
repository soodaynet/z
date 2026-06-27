/**
 * 轻量级日志工具 — 统一日志输出格式
 *
 * 替代裸 console.log/error，提供：
 * - 统一日志格式 `[module] message`
 * - 错误日志包含堆栈信息
 *
 * @example
 * ```ts
 * import { logger } from './utils/logger'
 * logger.info('DB', 'Initialized successfully')
 * logger.error('Auth', 'Token verification failed', err)
 * ```
 */

function format(module: string, message: string): string {
  return `[${module}] ${message}`
}

export const logger = {
  debug(module: string, message: string, ...args: unknown[]): void {
    console.debug(format(module, message), ...args)
  },

  info(module: string, message: string, ...args: unknown[]): void {
    console.info(format(module, message), ...args)
  },

  warn(module: string, message: string, ...args: unknown[]): void {
    console.warn(format(module, message), ...args)
  },

  error(module: string, message: string, err?: unknown): void {
    if (err instanceof Error) {
      console.error(`${format(module, message)}: ${err.message}`, err.stack)
    } else if (err !== undefined) {
      console.error(format(module, message), err)
    } else {
      console.error(format(module, message))
    }
  },
}
