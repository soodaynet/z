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
   * 优化：单轮 Promise.all 并行查询 userConfig / settings / panel 数据 / authInfo，
   * userConfig 传 skipUserCheck=true 跳过 users 表冗余查询（/init 中间件已校验用户存在），
   * panel.getAllData 传 null 跳过 user_configs 查询（由 userConfig.get 并行查得，避免重复查询），
   * Promise.all 完成后用 userCfg.panel 补全 panelConfig（依赖 userCfg，无法在 Promise.all 内解析）。
   *
   * @param user 认证用户（未登录时为 null）
   */
  async aggregate(user: AuthUser | null): Promise<InitResponse> {
    const userId = user?.userId || 0

    // 单轮并行：用户配置（含 panelJson）+ 系统设置 + 认证信息 + 面板数据
    // panel.getAllData 传 null：仅查 groups+icons，不查 user_configs（去重）也不解析 panelConfig
    const [userCfg, about, authInfo, panelData] = await Promise.all([
      this.userConfig.get(userId, true),
      this.settings.getAll(),
      InitService.buildAuthInfo(user),
      this.panel.getAllData(userId, null),
    ])

    // panelConfig 解析：用 userCfg.panel 补全（getAllData 传 null 时未解析）
    panelData.panelConfig = userCfg.panel

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
