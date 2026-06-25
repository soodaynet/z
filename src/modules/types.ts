import type { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import type { D1Database, Fetcher } from '@cloudflare/workers-types'

// 应用环境变量绑定
export interface AppBindings {
  DB: D1Database
  ASSETS: Fetcher
  JWT_SECRET: string
}

// 应用上下文（Hono 上下文泛型）
export interface AppContext {
  Bindings: AppBindings
  Variables: {
    // 认证信息（由 auth 中间件注入）
    userId?: number
    username?: string
    role?: number
    isPublicMode?: boolean
  }
}

// 模块定义接口
export interface ModuleDefinition {
  /** 模块名称（唯一标识） */
  name: string
  /** 挂载路径（如 '/panel', '/system'） */
  mountPath: string
  /** Hono 路由实例 */
  router: Hono<AppContext>
  /** 模块级中间件（仅作用于 mountPath 下） */
  middlewares?: MiddlewareHandler<AppContext>[]
}
