import { defineStore } from 'pinia'
import { i18n, loadLocaleAsync } from '@/locales'
import { LANG_KEY, THEME_KEY } from '@/utils/storageKeys'

export const useAppStore = defineStore('app', {
  state: () => ({
    language: (localStorage.getItem(LANG_KEY) as string) || 'zh-CN',
    theme: (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'auto') || 'auto',
  }),

  actions: {
    async setLanguage(lang: string) {
      this.language = lang
      localStorage.setItem(LANG_KEY, lang)
      // 同步 vue-i18n 全局 locale，使语言切换即时生效（无需刷新）
      const locale = lang === 'en-US' ? 'en-US' : 'zh-CN'
      // en-US 为懒加载 chunk，切换前确保已拉取（zh-CN 已同步内置）
      await loadLocaleAsync(locale)
      i18n.global.locale.value = locale
    },

    setTheme(theme: 'light' | 'dark' | 'auto') {
      this.theme = theme
      localStorage.setItem(THEME_KEY, theme)
    },
  },
})