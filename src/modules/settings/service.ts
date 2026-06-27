import type { D1Database } from '@cloudflare/workers-types'
import type { SystemSettingRow, UserRow } from '../shared/types'
import { queryAll, queryFirst } from '../shared/db'
import * as cache from '../shared/cache'

export class SettingsService {
  constructor(private db: D1Database) {}

  /**
   * 获取所有系统设置
   *
   * 缓存策略：内存缓存 'settings:all' TTL 30s，saveAll / upsertSetting 时主动失效。
   * @returns 配置键值对
   */
  async getAll(): Promise<Record<string, string>> {
    const cached = cache.get<Record<string, string>>('settings:all')
    if (cached !== undefined) return cached

    const rows = await queryAll<SystemSettingRow>(this.db, 'SELECT config_name, config_value FROM system_settings')
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.config_name] = row.config_value
    }
    cache.set('settings:all', settings, 30)
    return settings
  }

  /**
   * 获取单个系统设置值
   * @param configName 配置项名称
   * @returns 配置值，不存在时返回空字符串
   */
  async get(configName: string): Promise<string> {
    const row = await queryFirst<SystemSettingRow>(
      this.db,
      'SELECT config_value FROM system_settings WHERE config_name = ?',
      configName,
    )
    return row?.config_value ?? ''
  }

  /**
   * 设置单个系统配置（存在则更新，不存在则插入）
   * @param configName 配置项名称
   * @param configValue 配置值
   */
  async set(configName: string, configValue: string) {
    await this.upsertSetting(configName, configValue)
  }

  /**
   * 批量保存系统设置
   *
   * 使用 INSERT ... ON CONFLICT 单语句 + db.batch 一次往返，替代旧的 SELECT-then-UPDATE/INSERT 反模式（2N 次查询）。
   * @param entries 配置键值对
   */
  async saveAll(entries: Record<string, string>) {
    const kvList = Object.entries(entries)
    if (kvList.length === 0) return

    const stmt = this.db.prepare(
      `INSERT INTO system_settings (config_name, config_value) VALUES (?, ?)
       ON CONFLICT(config_name) DO UPDATE SET config_value = excluded.config_value, updated_at = datetime('now')`,
    )
    await this.db.batch(
      kvList.map(([configName, configValue]) => stmt.bind(configName, configValue ?? '')),
    )
    // 失效公开访问相关缓存（public-visit-config / public-visit-user）
    cache.invalidateByPrefix('public-visit-')
    // 失效 settings.getAll 内存缓存
    cache.invalidate('settings:all')
  }

  // ========== 公开访问用户 ==========

  /**
   * 获取公开访问用户信息
   * @returns 用户信息，未配置时返回 null
   */
  async getPublicVisitUser() {
    const setting = (await this.db
      .prepare("SELECT config_value FROM system_settings WHERE config_name = 'panel_public_user_id'")
      .first()) as { config_value: string } | null

    const userId = setting?.config_value ? parseInt(setting.config_value, 10) : null
    if (!userId) return null

    const user = await queryFirst<UserRow>(
      this.db,
      'SELECT id, username, name, head_image, role, status, mail, created_at FROM users WHERE id = ?',
      userId,
    )

    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      headImage: user.head_image,
      status: user.status,
      role: user.role,
      mail: user.mail,
      created_at: user.created_at,
    }
  }

  /**
   * 设置公开访问用户
   * @param userId 用户 ID，null 表示取消设置
   * @throws Error 用户不存在
   */
  async setPublicVisitUser(userId: number | null) {
    if (userId === null || userId === undefined) {
      await this.db.prepare("DELETE FROM system_settings WHERE config_name = 'panel_public_user_id'").run()
    } else {
      const user = await this.db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first()
      if (!user) throw new Error('用户不存在')

      await this.upsertSetting('panel_public_user_id', String(userId))
    }
    // 主动失效公开访问相关缓存（覆盖 DELETE 与 upsert 两条路径）
    cache.invalidate('public-visit-config')
    cache.invalidate('public-visit-user')
  }

  // ========== 私有方法 ==========

  /**
   * 插入或更新单个设置项（存在则更新，不存在则插入）
   *
   * 使用 INSERT ... ON CONFLICT 单语句，替代旧的 SELECT-then-UPDATE/INSERT 反模式（2 次查询）。
   * @param configName 配置项名称
   * @param configValue 配置值
   */
  private async upsertSetting(configName: string, configValue: string) {
    await this.db
      .prepare(
        `INSERT INTO system_settings (config_name, config_value) VALUES (?, ?)
         ON CONFLICT(config_name) DO UPDATE SET config_value = excluded.config_value, updated_at = datetime('now')`,
      )
      .bind(configName, configValue ?? '')
      .run()
    // 失效公开访问相关缓存（public-visit-config / public-visit-user）
    cache.invalidateByPrefix('public-visit-')
    // 失效 settings.getAll 内存缓存
    cache.invalidate('settings:all')
  }
}
