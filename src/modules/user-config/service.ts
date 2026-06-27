import type { D1Database } from '@cloudflare/workers-types'
import { queryFirst } from '../shared/db'
import { AppError } from '../shared/errors'
import type { UserConfigRow, UserConfigData } from './types'

/**
 * 用户配置服务层 — 封装 user_configs 表的 CRUD 操作
 *
 * 职责：
 * - 获取用户配置（不存在时自动初始化空记录）
 * - 保存用户配置（存在则更新，不存在则插入）
 *
 * 所有写操作均通过 userId 进行数据隔离，防止越权操作。
 */
export class UserConfigService {
  constructor(private db: D1Database) {}

  /**
   * 获取用户配置
   * - 校验用户存在（除非 skipUserCheck=true）
   * - 若 user_configs 无记录，则插入空记录并返回空配置
   * @param userId 用户 ID
   * @param skipUserCheck 跳过 users 表存在性校验（用于 /init 上下文，中间件已校验）
   * @throws AppError 用户不存在时抛出 400 错误
   */
  async get(userId: number, skipUserCheck?: boolean): Promise<UserConfigData> {
    // /init 上下文已由中间件校验用户存在，跳过冗余 SELECT users 查询
    const row = await queryFirst<UserConfigRow>(
      this.db,
      'SELECT panel_json, search_engine_json FROM user_configs WHERE user_id = ?',
      userId,
    )

    if (!skipUserCheck) {
      const user = await queryFirst<{ id: number }>(this.db, 'SELECT id FROM users WHERE id = ?', userId)
      if (!user) throw AppError.badRequest('用户不存在')
    }

    if (!row) {
      await this.db.prepare('INSERT INTO user_configs (user_id) VALUES (?)').bind(userId).run()
      return { panel: {}, searchEngine: {} }
    }

    return {
      panel: JSON.parse(row.panel_json || '{}'),
      searchEngine: JSON.parse(row.search_engine_json || '{}'),
    }
  }

  /**
   * 保存用户配置（存在则更新，不存在则插入）
   *
   * 使用 INSERT ... ON CONFLICT 单语句，替代旧的 SELECT-then-UPDATE/INSERT 反模式（2 次查询）。
   * @param userId 用户 ID
   * @param panelJson 面板配置 JSON 字符串
   * @param searchEngineJson 搜索引擎配置 JSON 字符串
   */
  async set(userId: number, panelJson: string, searchEngineJson: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_configs (user_id, panel_json, search_engine_json) VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET panel_json = excluded.panel_json, search_engine_json = excluded.search_engine_json, updated_at = datetime('now')`,
      )
      .bind(userId, panelJson, searchEngineJson)
      .run()
  }

  /**
   * 仅更新 panel_json，search_engine_json 保持原值（局部更新）
   *
   * 使用 INSERT ... ON CONFLICT 单语句：不存在记录时插入（search_engine_json 用默认 '{}'），
   * 存在时仅更新 panel_json，不动 search_engine_json。
   */
  async updatePanel(userId: number, panelJson: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_configs (user_id, panel_json, search_engine_json) VALUES (?, ?, '{}')
         ON CONFLICT(user_id) DO UPDATE SET panel_json = excluded.panel_json, updated_at = datetime('now')`,
      )
      .bind(userId, panelJson)
      .run()
  }

  /**
   * 仅更新 search_engine_json，panel_json 保持原值（局部更新）
   *
   * 使用 INSERT ... ON CONFLICT 单语句：不存在记录时插入（panel_json 用默认 '{}'），
   * 存在时仅更新 search_engine_json，不动 panel_json。
   */
  async updateSearchEngine(userId: number, searchEngineJson: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO user_configs (user_id, panel_json, search_engine_json) VALUES (?, '{}', ?)
         ON CONFLICT(user_id) DO UPDATE SET search_engine_json = excluded.search_engine_json, updated_at = datetime('now')`,
      )
      .bind(userId, searchEngineJson)
      .run()
  }
}
