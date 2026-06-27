import type { D1Database } from '@cloudflare/workers-types'
import type { UserRow } from '../shared/types'
import { hashPassword, verifyPassword } from '../shared/password'
import { queryAll, queryFirst } from '../shared/db'
import { AppError } from '../shared/errors'
import * as cache from '../shared/cache'
import { USER_SELECT, formatUserInfo } from '../shared/userFormatter'

/** 用户公开信息字段（不含 password） */
const USER_PUBLIC_SELECT = 'SELECT id, username, name, head_image, status, role, mail, created_at FROM users'

export class UserService {
  constructor(private db: D1Database) {}

  // ========== 查询方法 ==========

  /**
   * 根据 ID 查找用户
   * @param id 用户 ID
   */
  async findById(id: number): Promise<UserRow | null> {
    return queryFirst<UserRow>(this.db, `${USER_SELECT} WHERE id = ?`, id)
  }

  /**
   * 获取用户公开信息
   * @param id 用户 ID
   */
  async getUserInfo(id: number) {
    const row = await this.findById(id)
    if (!row) return null
    return formatUserInfo(row)
  }

  // ========== 个人信息 ==========

  /**
   * 更新用户名称
   * @param userId 用户 ID
   * @param name 新名称
   */
  async updateName(userId: number, name: string) {
    await this.db
      .prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(name, userId)
      .run()
  }

  /**
   * 更新用户密码
   * @param userId 用户 ID
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   * @throws AppError 用户不存在、原密码错误
   */
  async updatePassword(userId: number, oldPassword: string, newPassword: string) {
    const row = await queryFirst<UserRow>(this.db, 'SELECT password FROM users WHERE id = ?', userId)
    if (!row) throw AppError.notFound('用户不存在')

    const valid = await verifyPassword(oldPassword, row.password)
    if (!valid) throw AppError.badRequest('原密码错误')

    const newHash = await hashPassword(newPassword)
    await this.db
      .prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(newHash, userId)
      .run()

    return { success: true }
  }

  // ========== 管理员 - 用户管理 ==========

  /**
   * 获取用户列表（分页）
   * @param page 页码
   * @param pageSize 每页条数
   */
  async getList(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize
    const [list, countResult] = await Promise.all([
      queryAll<UserRow>(this.db, `${USER_PUBLIC_SELECT} ORDER BY id DESC LIMIT ? OFFSET ?`, pageSize, offset),
      this.db.prepare('SELECT COUNT(*) as total FROM users').first() as Promise<{ total: number }>,
    ])

    const mapped = list.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      headImage: r.head_image,
      status: r.status,
      role: r.role,
      mail: r.mail,
      createTime: r.created_at,
      updateTime: r.updated_at,
    }))

    return { list: mapped, total: countResult.total, page, pageSize }
  }

  /**
   * 管理员创建用户
   * @param username 用户名
   * @param password 密码
   * @param name 名称
   * @param role 角色（1=管理员, 2=普通用户）
   * @param status 状态（1=启用, 0=禁用）
   * @throws AppError 用户名已存在
   */
  async adminCreate(username: string, password: string, name: string, role = 2, status = 1) {
    const existing = await this.db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
    if (existing) throw AppError.conflict('该用户名已被注册')

    const hashedPwd = await hashPassword(password)
    await this.db
      .prepare('INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)')
      .bind(username, hashedPwd, name || username, role, status)
      .run()

    return { success: true }
  }

  /**
   * 管理员更新用户信息（仅更新传入的字段）
   * @param id 用户 ID
   * @param data 要更新的字段（可选）
   * @throws AppError 用户名冲突、无更新数据
   */
  async adminUpdate(
    id: number,
    data: {
      username?: string
      password?: string
      name?: string
      role?: number
      status?: number
    },
  ) {
    const updates: string[] = []
    const params: unknown[] = []

    // 字段 → 更新映射（统一处理，降低圈复杂度）
    const fieldMap: Array<{ field: string; value: unknown }> = [
      { field: 'username', value: data.username },
      { field: 'name', value: data.name },
      { field: 'role', value: data.role },
      { field: 'status', value: data.status },
    ]

    // 用户名唯一性检查
    if (data.username) {
      const existing = await this.db
        .prepare('SELECT id FROM users WHERE username = ? AND id != ?')
        .bind(data.username, id)
        .first()
      if (existing) throw AppError.conflict('该用户名已被注册')
    }

    // 密码需单独处理（需要哈希）
    if (data.password) {
      updates.push('password = ?')
      params.push(await hashPassword(data.password))
    }

    for (const { field, value } of fieldMap) {
      if (value !== undefined) {
        updates.push(`${field} = ?`)
        params.push(value)
      }
    }

    if (updates.length === 0) throw AppError.badRequest('无更新数据')

    updates.push("updated_at = datetime('now')")
    params.push(id)

    await this.db
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run()
    return { success: true }
  }

  /**
   * 管理员批量删除用户
   * 同时删除用户关联的图标、分组和配置，防止自己删除自己
   *
   * 使用 db.batch 一次往返完成 4 条 DELETE（保持外键依赖顺序：图标 → 分组 → 配置 → 用户）。
   * @param userIds 要删除的用户 ID 列表
   * @param selfUserId 当前操作者 ID
   * @throws AppError 尝试删除自己
   */
  async adminDelete(userIds: number[], selfUserId: number) {
    const filteredIds = userIds.filter((id) => id !== selfUserId)
    if (filteredIds.length === 0) throw AppError.badRequest('不能删除自己')

    const placeholders = filteredIds.map(() => '?').join(',')
    await this.db.batch([
      this.db.prepare(`DELETE FROM item_icons WHERE user_id IN (${placeholders})`).bind(...filteredIds),
      this.db.prepare(`DELETE FROM item_icon_groups WHERE user_id IN (${placeholders})`).bind(...filteredIds),
      this.db.prepare(`DELETE FROM user_configs WHERE user_id IN (${placeholders})`).bind(...filteredIds),
      this.db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).bind(...filteredIds),
    ])

    return { success: true }
  }

  // ========== 公开访问用户（直接读写 system_settings.panel_public_user_id） ==========

  /**
   * 获取公开访问用户 ID
   *
   * 直接查询 `system_settings` 表的 `panel_public_user_id` 配置，避免跨模块依赖 SettingsService。
   * 用户行查询走 `getUserInfo`（与本模块职责一致）。
   * @returns 用户 ID，未配置时返回 null
   */
  async getPublicVisitUserId(): Promise<number | null> {
    const setting = (await this.db
      .prepare("SELECT config_value FROM system_settings WHERE config_name = 'panel_public_user_id'")
      .first()) as { config_value: string } | null
    if (!setting?.config_value) return null
    const userId = parseInt(setting.config_value, 10)
    return Number.isFinite(userId) ? userId : null
  }

  /**
   * 设置公开访问用户 ID
   *
   * 直接写 `system_settings` 表的 `panel_public_user_id` 配置，避免跨模块依赖 SettingsService。
   * 写完后主动失效 `public-visit-config` / `public-visit-user` 缓存（与原 SettingsService.setPublicVisitUser 行为一致）。
   * @param userId 用户 ID，null 表示取消设置
   * @throws AppError 用户不存在
   */
  async setPublicVisitUserId(userId: number | null) {
    if (userId === null || userId === undefined) {
      await this.db.prepare("DELETE FROM system_settings WHERE config_name = 'panel_public_user_id'").run()
    } else {
      const user = await this.db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first()
      if (!user) throw AppError.notFound('用户不存在')

      await this.db
        .prepare(
          `INSERT INTO system_settings (config_name, config_value) VALUES (?, ?)
           ON CONFLICT(config_name) DO UPDATE SET config_value = excluded.config_value, updated_at = datetime('now')`,
        )
        .bind('panel_public_user_id', String(userId))
        .run()
    }
    // 主动失效公开访问相关缓存（覆盖 DELETE 与 upsert 两条路径）
    cache.invalidate('public-visit-config')
    cache.invalidate('public-visit-user')
  }
}
