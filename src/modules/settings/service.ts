import type { D1Database } from '@cloudflare/workers-types'
import type { SystemSettingRow } from '../../models/types'
import { queryAll, queryFirst } from '../shared/db'

export class SettingsService {
  constructor(private db: D1Database) {}

  /**
   * 获取所有系统设置
   * @returns 配置键值对
   */
  async getAll(): Promise<Record<string, string>> {
    const rows = await queryAll<SystemSettingRow>(this.db, 'SELECT config_name, config_value FROM system_settings')
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.config_name] = row.config_value
    }
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
   * @param entries 配置键值对
   */
  async saveAll(entries: Record<string, string>) {
    const kvList = Object.entries(entries)
    await Promise.all(
      kvList.map(([configName, configValue]) => this.upsertSetting(configName, configValue)),
    )
  }

  // ========== 私有方法 ==========

  /**
   * 插入或更新单个设置项（存在则更新，不存在则插入）
   * @param configName 配置项名称
   * @param configValue 配置值
   */
  private async upsertSetting(configName: string, configValue: string) {
    const existing = await this.db
      .prepare('SELECT id FROM system_settings WHERE config_name = ?')
      .bind(configName)
      .first()

    if (existing) {
      await this.db
        .prepare("UPDATE system_settings SET config_value = ?, updated_at = datetime('now') WHERE config_name = ?")
        .bind(configValue ?? '', configName)
        .run()
    } else {
      await this.db
        .prepare('INSERT INTO system_settings (config_name, config_value) VALUES (?, ?)')
        .bind(configName, configValue ?? '')
        .run()
    }
  }
}
