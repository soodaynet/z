import { Hono } from 'hono'
import type { AppContext } from '../types'
import { publicModeMiddleware, getAuthUser } from '../shared/middleware/auth'
import { ServiceFactory } from '../../services/ServiceFactory'
import { ok } from '../shared/response'
import { InitService } from './service'

export const router = new Hono<AppContext>()

// publicModeMiddleware 使用旧的 Context 类型，临时以 as any 适配 AppContext
router.use('*', publicModeMiddleware as any)

router.post('/init', async (c) => {
  const user = getAuthUser(c as any)
  const factory = ServiceFactory.from(c.env.DB)
  const service = new InitService(factory)
  const data = await service.aggregate(user)

  c.header('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
  return ok(c, data)
})
