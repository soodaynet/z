import { Hono } from 'hono'
import type { AppContext } from '../types'
import { publicModeMiddleware } from '../shared/middleware/auth'
import { validate } from '../shared/validate'
import { ok } from '../shared/response'
import { hitokotoParamsSchema } from './validator'
import { getHitokoto } from './service'
import type { HitokotoParams } from './types'

export const router = new Hono<AppContext>()

router.use('*', publicModeMiddleware)

/**
 * 获取一言
 * POST /panel/hitokoto/get
 */
router.post('/get', validate(hitokotoParamsSchema), async (c) => {
  const params = c.var.validatedBody as HitokotoParams
  const data = await getHitokoto(params)
  c.header('Cache-Control', 'private, max-age=60')
  return ok(c, data)
})
