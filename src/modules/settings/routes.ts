import { Hono } from 'hono'
import { adminMiddleware, authMiddleware } from '../shared/middleware/auth'
import { validate } from '../shared/validate'
import { ok } from '../shared/response'
import type { AppContext } from '../types'
import { SettingsService } from './service'
import { settingGetSchema, settingSetSchema, saveAllSchema } from './validator'

export const router = new Hono<AppContext>()

/**
 * 获取单个系统设置（公开可访问，用于登录页获取站点信息）
 * POST /system/setting/get
 */
router.post('/system/setting/get', validate(settingGetSchema), async (c) => {
  const { configName } = c.var.validatedBody as { configName: string }
  const service = new SettingsService(c.env.DB)
  const value = await service.get(configName)
  return ok(c, value)
})

/**
 * 保存单个系统设置（管理员）
 * POST /system/setting/set
 */
router.post(
  '/system/setting/set',
  authMiddleware as any,
  adminMiddleware as any,
  validate(settingSetSchema),
  async (c) => {
    const { configName, configValue } = c.var.validatedBody as { configName: string; configValue?: string }
    const service = new SettingsService(c.env.DB)
    await service.set(configName, configValue ?? '')
    return ok(c, null)
  },
)

/**
 * 批量保存系统设置（管理员）
 * POST /system/settings/saveAll
 */
router.post(
  '/system/settings/saveAll',
  authMiddleware as any,
  adminMiddleware as any,
  validate(saveAllSchema),
  async (c) => {
    const body = c.var.validatedBody as Record<string, string>
    const service = new SettingsService(c.env.DB)
    await service.saveAll(body)
    return ok(c, null)
  },
)

/**
 * 获取所有设置（公开）
 * POST /about
 */
router.post('/about', async (c) => {
  const service = new SettingsService(c.env.DB)
  const settings = await service.getAll()
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  c.header('CDN-Cache-Control', 'public, max-age=600')
  return ok(c, settings)
})
