import { createI18n } from 'vue-i18n'
import type { App } from 'vue'
import zhCN from './zh-CN.json'
import { LANG_KEY } from '@/utils/storageKeys'

// 从本地存储恢复上次选择的语言，避免刷新后回退到默认语言
const savedLang = localStorage.getItem(LANG_KEY) || 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'zh-CN',
  messages: {
    // 默认语言 zh-CN 同步内置；en-US 占位空对象保留 locale 类型，实际文案懒加载后注入
    'zh-CN': zhCN,
    'en-US': {},
  },
})

// 已加载的 locale 集合，避免重复拉取 chunk
const loadedLocales = new Set<string>(['zh-CN'])

/**
 * 按需加载非默认 locale（en-US）chunk 并注入 vue-i18n。
 * zh-CN 已同步内置；切换到 en-US 时拉取独立 chunk，未加载前回退到 zh-CN。
 */
export async function loadLocaleAsync(locale: string): Promise<void> {
  if (loadedLocales.has(locale)) return
  if (locale === 'en-US') {
    const mod = await import('./en-US.json')
    i18n.global.setLocaleMessage('en-US', mod.default)
    loadedLocales.add('en-US')
  }
}

// 启动时若保存的语言为非默认（en-US），按需拉取对应 chunk
if (savedLang !== 'zh-CN') {
  loadLocaleAsync(savedLang)
}

export function setupI18n(app: App) {
  app.use(i18n)
}
