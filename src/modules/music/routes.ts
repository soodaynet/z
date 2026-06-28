import { Hono } from 'hono'
import type { AppContext } from '../types'
import { publicModeMiddleware } from '../shared/middleware/auth'
import { validate } from '../shared/validate'
import { ok } from '../shared/response'
import { musicParseSchema } from './validator'
import { parseMusic } from './service'
import type { MusicParseParams } from './types'

export const router = new Hono<AppContext>()

router.use('*', publicModeMiddleware)

router.post('/parse', validate(musicParseSchema), async (c) => {
  const params = c.var.validatedBody as MusicParseParams
  const data = await parseMusic(params)
  c.header('Cache-Control', 'private, max-age=60')
  return ok(c, data)
})
