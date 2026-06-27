import type { AuthUser } from '../shared/types'
import type { PanelService } from '../panel/service'
import type { SettingsService } from '../settings/service'
import type { UserConfigService } from '../user-config/service'
import type { InitAuthInfo, InitResponse } from './types'
import { normalizeSearchEngineConfig } from '../shared/searchEngine'

/**
 * init 服务层 — 聚合面板初始化所需的全部数据
 *
 * 聚合内容：
 * - 面板数据（分组、图标、面板配置）：PanelService.getAllData
 * - 系统设置：SettingsService.getAll
 * - 认证信息：基于 auth 中间件注入的 user 构建
 * - 搜索引擎配置：UserConfigService.get（空配置时回退默认）
 */
export class InitService {
  constructor(
    private panel: PanelService,
    private settings: SettingsService,
    private userConfig: UserConfigService,
  ) {}

  /**
   * 聚合返回面板数据、系统设置、认证信息、搜索引擎配置
   *
   * 优化：先取 userConfig（/init 中间件已校验用户存在，传 skipUserCheck=true 跳过 users 表冗余查询），
   * 再将已查得的 panelJson 复用给 panel.getAllData，避免 user_configs 表被重复查询。
   *
   * @param user 认证用户（未登录时为 null）
   */
  async aggregate(user: AuthUser | null): Promise<InitResponse> {
    const userId = user?.userId || 0

    // 第一轮并行：用户配置（含 panelJson）+ 系统设置 + 认证信息
    const [userCfg, about, authInfo] = await Promise.all([
      this.userConfig.get(userId, true),
      this.settings.getAll(),
      InitService.buildAuthInfo(user),
    ])

    // 第二轮：复用 userCfg.panel 作为 panelJson，跳过 panel.getAllData 内部的 user_configs 查询
    const panelData = await this.panel.getAllData(userId, JSON.stringify(userCfg.panel))

    return {
      ...panelData,
      about,
      authInfo,
      searchEngine: normalizeSearchEngineConfig(userCfg.searchEngine),
    }
  }

  /** 根据认证用户构建 authInfo */
  private static buildAuthInfo(user: AuthUser | null): InitAuthInfo {
    if (user) {
      return {
        user: {
          id: user.userId,
          username: user.username,
          name: user.name || '',
          role: user.role,
        },
        visitMode: user.visitMode,
      }
    }
    return { user: null, visitMode: 1 }
  }
}
