/**
 * 面板模块类型定义
 */

export type PanelConfigStyleEnum = 'text' | 'image' | 'detail'

export interface SortItemRequest {
  id: number
  sort: number
}

export interface ItemIcon {
  itemType: number
  src?: string
  text?: string
  backgroundColor?: string
}

export interface ItemIconGroup {
  id?: number
  icon?: string
  title: string
  description?: string
  sort?: number
  publicVisible?: number
  userId?: number
  createTime?: string
  updateTime?: string
}

export interface ItemInfo {
  id?: number
  icon: ItemIcon | null
  title: string
  url: string
  sort?: number
  description?: string
  openMethod: number
  itemIconGroupId?: number
  userId?: number
  createTime?: string
  updateTime?: string
}

export interface ItemIconSortRequest {
  sortItems: SortItemRequest[]
  itemIconGroupId: number
}

export interface PanelConfig {
  backgroundImageSrc?: string
  backgroundBlur?: number
  backgroundMaskNumber?: number
  iconStyle?: PanelConfigStyleEnum
  iconTextColor?: string
  iconTextInfoHideDescription?: boolean
  iconTextIconHideTitle?: boolean
  logoText?: string
  logoImageSrc?: string
  logoPositionTop?: number
  logoPositionLeft?: number
  logoSize?: number
  clockShowSecond?: boolean
  clockColor?: string
  searchBoxShow?: boolean
  searchBoxSearchIcon?: boolean
  marginTop?: number
  marginBottom?: number
  maxWidth?: number
  maxWidthUnit?: string
  marginX?: number
  footerHtml?: string
  announcement?: string
  announcementDuration?: number
  announcementBlur?: number
  announcementMaskOpacity?: number
  systemMonitorShow?: boolean
  systemMonitorShowTitle?: boolean
  systemMonitorPublicVisitModeShow?: boolean
}

/** getAllData 一次性返回的聚合数据 */
export interface AllDataResponse {
  groups: ItemIconGroup[]
  itemsMap: Record<number, ItemInfo[]>
  panelConfig: PanelConfig
}

/** getSiteFavicon 返回结构（与后端 FaviconResponse 对齐：所有字段必填，缺失时为空字符串） */
export interface SiteFaviconResponse {
  iconUrls: string[]
  title: string
  description: string
  siteName: string
}

/** 站点级配置（来自 system_settings，键名以下划线分隔） */
export interface SiteConfig {
  site_title?: string
  login_bg_image?: string
  login_blur?: number
  login_mask_opacity?: number
  footer_html?: string
  logo_text?: string
  logo_image_src?: string
  favicon_url?: string
}

/** 搜索引擎 */
export interface SearchEngine {
  name: string
  url: string
  icon?: string
}

/** 搜索引擎配置 */
export interface SearchEngineConfig {
  engines: SearchEngine[]
  currentIndex: number
}
