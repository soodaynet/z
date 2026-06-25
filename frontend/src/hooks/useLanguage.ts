import { computed } from 'vue'
import { useAppStore } from '@/store'
import { i18n } from '@/locales'

/**
 * 语言 hook：暴露当前语言并同步 vue-i18n 全局 locale
 * 不再依赖 Naive UI 的语言包，语言切换通过 vue-i18n 驱动
 */
export function useLanguage() {
  const appStore = useAppStore()

  const language = computed(() => appStore.language)

  function setLanguage(lang: string) {
    appStore.setLanguage(lang)
    // 同步 vue-i18n 全局 locale（Composition API 模式下为 ref）
    const locale = lang === 'en-US' ? 'en-US' : 'zh-CN' as 'zh-CN' | 'en-US'
    i18n.global.locale.value = locale
  }

  return { language, setLanguage }
}
