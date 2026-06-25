import type { ServiceFactory } from '../../services/ServiceFactory'
import type { AuthUser } from '../shared/middleware/auth'
import type { InitAuthInfo, InitResponse } from './types'

/**
 * init 服务层 — 聚合面板初始化所需的全部数据
 *
 * 聚合内容：
 * - 面板数据（分组、图标、面板配置）：PanelService.getAllData
 * - 系统设置：SettingsService.getAll
 * - 认证信息：基于 auth 中间件注入的 user 构建
 *
 * PanelService / SettingsService 尚未迁移至模块化架构，
 * 暂时通过 ServiceFactory 引用旧服务，后续模块重构完成后再切换。
 */
export class InitService {
  constructor(private factory: ServiceFactory) {}

  /**
   * 聚合返回面板数据、系统设置、认证信息
   * @param user 认证用户（未登录时为 null）
   */
  async aggregate(user: AuthUser | null): Promise<InitResponse> {
    const [panelData, about, authInfo] = await Promise.all([
      this.factory.panel.getAllData(user?.userId || 0),
      this.factory.settings.getAll(),
      InitService.buildAuthInfo(user),
    ])

    return {
      ...panelData,
      about,
      authInfo,
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
