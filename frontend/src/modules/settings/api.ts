import { post } from '@/utils/request'
import type { AboutResponse, SiteSettings } from './types'

// ========== 系统设置 API ==========
export function getAbout<T = AboutResponse>() {
  return post<T>({ url: '/about' })
}

// ========== 站点全局设置 API ==========
export function saveSiteSettings<T>(settings: SiteSettings) {
  return post<T>({ url: '/system/settings/saveAll', data: settings })
}

// ========== 聚合初始化 API ==========
export function getInit<T = AboutResponse>() {
  return post<T>({ url: '/init' })
}
