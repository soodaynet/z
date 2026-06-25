import { Hono } from 'hono'
import type { z } from 'zod'
import { authMiddleware, adminMiddleware, publicModeMiddleware, getAuthUser } from '../shared/middleware/auth'
import { validate } from '../shared/validate'
import { ok, fail } from '../shared/response'
import type { AppContext } from '../types'
import { UserService } from './service'
import { SettingsService } from '../../services/SettingsService'
import {
  userListSchema,
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  updateNameSchema,
  updatePasswordSchema,
  publicVisitUserSchema,
} from './validator'

// ========== 管理员路由（挂载于 /panel/users）==========
export const adminRouter = new Hono<AppContext>()

adminRouter.post('/getList', authMiddleware as any, adminMiddleware as any, validate(userListSchema), async (c) => {
  const { page, pageSize } = c.get('validatedBody') as z.infer<typeof userListSchema>
  const service = new UserService(c.env.DB)
  const data = await service.getList(page, pageSize)
  return ok(c, data)
})

adminRouter.post('/create', authMiddleware as any, adminMiddleware as any, validate(userCreateSchema), async (c) => {
  const { username, password, name, role, status } = c.get('validatedBody') as z.infer<typeof userCreateSchema>
  const service = new UserService(c.env.DB)
  await service.adminCreate(username, password, name || username, role, status)
  return ok(c, null)
})

adminRouter.post('/update', authMiddleware as any, adminMiddleware as any, validate(userUpdateSchema), async (c) => {
  const { id, ...data } = c.get('validatedBody') as z.infer<typeof userUpdateSchema>
  const service = new UserService(c.env.DB)
  await service.adminUpdate(id, data)
  return ok(c, null)
})

adminRouter.post('/deletes', authMiddleware as any, adminMiddleware as any, validate(userDeleteSchema), async (c) => {
  const authUser = getAuthUser(c)!
  const { userIds } = c.get('validatedBody') as z.infer<typeof userDeleteSchema>
  const service = new UserService(c.env.DB)
  await service.adminDelete(userIds, authUser.userId)
  return ok(c, null)
})

adminRouter.post('/getPublicVisitUser', authMiddleware as any, adminMiddleware as any, async (c) => {
  const settings = new SettingsService(c.env.DB)
  const data = await settings.getPublicVisitUser()
  return ok(c, data)
})

adminRouter.post(
  '/setPublicVisitUser',
  authMiddleware as any,
  adminMiddleware as any,
  validate(publicVisitUserSchema),
  async (c) => {
    const { userId } = c.get('validatedBody') as z.infer<typeof publicVisitUserSchema>
    const settings = new SettingsService(c.env.DB)

    if (userId === null || userId === undefined) {
      await settings.setPublicVisitUser(null)
      return ok(c, null)
    }

    await settings.setPublicVisitUser(userId)
    return ok(c, null)
  },
)

// ========== 个人信息路由（挂载于 /user）==========
export const selfRouter = new Hono<AppContext>()

selfRouter.post('/getAuthInfo', publicModeMiddleware as any, async (c) => {
  const user = getAuthUser(c)!
  const service = new UserService(c.env.DB)

  const info = await service.getUserInfo(user.userId)
  if (!info) return fail(c, '用户不存在')

  return ok(c, { user: info, visitMode: user.visitMode })
})

selfRouter.post('/updateInfo', authMiddleware as any, validate(updateNameSchema), async (c) => {
  const user = getAuthUser(c)!
  const { name } = c.get('validatedBody') as z.infer<typeof updateNameSchema>
  const service = new UserService(c.env.DB)

  await service.updateName(user.userId, name)
  return ok(c, null)
})

selfRouter.post('/updatePassword', authMiddleware as any, validate(updatePasswordSchema), async (c) => {
  const user = getAuthUser(c)!
  const { oldPassword, newPassword } = c.get('validatedBody') as z.infer<typeof updatePasswordSchema>
  const service = new UserService(c.env.DB)

  await service.updatePassword(user.userId, oldPassword, newPassword)
  return ok(c, null)
})
