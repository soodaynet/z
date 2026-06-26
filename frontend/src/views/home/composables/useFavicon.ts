import { ref } from 'vue'
import { toast } from '@/components/ui/sonner'
import { getSiteFavicon } from '@/modules'

/**
 * 从 URL 域名提取可读标题
 * - 取 hostname，去除 www. 前缀
 * - 按 . 分割并丢弃最后一段（TLD，如 com/org/cn）
 * - 剩余段按 . 与 - 进一步分词，每段首字母大写，空格连接
 * - URL 解析失败时返回空字符串
 */
function extractTitleFromDomain(url: string): string {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return ''
  }
  // 去除 www. 前缀
  if (hostname.startsWith('www.')) {
    hostname = hostname.slice(4)
  }
  // 按 . 分割并丢弃最后一段（TLD）
  const parts = hostname.split('.').slice(0, -1)
  // 剩余段按 . 与 - 进一步分词，每段首字母大写
  const words: string[] = []
  for (const part of parts) {
    for (const w of part.split(/[.-]/)) {
      if (w) {
        words.push(w.charAt(0).toUpperCase() + w.slice(1))
      }
    }
  }
  return words.join(' ')
}

/**
 * 前端直接 fetch 目标站点，解析 <title> 与 icon link
 * - 使用 AbortController 设置 5 秒超时
 * - CORS 模式 + follow 重定向
 * - 任何失败（CORS/网络/超时/resp.ok=false）都不抛错，返回空结果
 */
async function fetchSiteTitle(url: string): Promise<{ title: string | null; iconUrls: string[] }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const resp = await fetch(url, {
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!resp.ok) {
      return { title: null, iconUrls: [] }
    }
    const html = await resp.text()

    // 解析 <title>（大小写不敏感，提取 group 1 并 trim，空串视为无标题）
    let title: string | null = null
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      const trimmed = titleMatch[1].trim()
      title = trimmed || null
    }

    // 解析 icon link：双向匹配（rel 在前 或 href 在前），大小写不敏感
    const relFirst = /<link\b[^>]*?\brel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*?\bhref=["']([^"']+)["'][^>]*?>/gi
    const hrefFirst = /<link\b[^>]*?\bhref=["']([^"']+)["'][^>]*?\brel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*?>/gi
    const hrefs: string[] = []
    let m: RegExpExecArray | null
    while ((m = relFirst.exec(html)) !== null) {
      hrefs.push(m[1])
    }
    while ((m = hrefFirst.exec(html)) !== null) {
      hrefs.push(m[1])
    }

    // 相对路径转绝对 + 去重
    const iconUrls: string[] = []
    const seen = new Set<string>()
    for (const href of hrefs) {
      try {
        const absolute = new URL(href, url).href
        if (!seen.has(absolute)) {
          seen.add(absolute)
          iconUrls.push(absolute)
        }
      } catch {
        // 无效 href 跳过
      }
    }

    return { title, iconUrls }
  } catch {
    // CORS/网络/超时等异常：吞掉，返回空结果
    return { title: null, iconUrls: [] }
  } finally {
    clearTimeout(timer)
  }
}

export function useFavicon() {
  const getIconLoading = ref(false)
  const iconCandidates = ref<string[]>([])

  /**
   * 并行获取图标候选与站点标题
   * - 后端 getSiteFavicon 与前端 fetchSiteTitle 同时执行（Promise.allSettled）
   * - 合并去重 iconUrls，后端候选优先
   * - title 优先 fetch 解析，失败回退 extractTitleFromDomain，全失败为 null
   */
  async function getIconByUrl(url: string): Promise<{ iconUrls: string[]; title: string | null }> {
    if (!url) {
      toast.warning('请先输入网址')
      return { iconUrls: [], title: null }
    }
    getIconLoading.value = true
    iconCandidates.value = []
    try {
      const [backendResult, fetchResult] = await Promise.allSettled([
        getSiteFavicon<{ iconUrls: string[] }>(url),
        fetchSiteTitle(url),
      ])

      // 后端图标候选（仅 code === 0 且有数据时采用）
      const backendValue =
        backendResult.status === 'fulfilled' ? backendResult.value : null
      const backendIconUrls: string[] =
        backendValue &&
        backendValue.code === 0 &&
        backendValue.data &&
        backendValue.data.iconUrls.length > 0
          ? backendValue.data.iconUrls
          : []

      // 前端 fetch 解析结果
      const fetchValue = fetchResult.status === 'fulfilled' ? fetchResult.value : null
      const fetchedTitle: string | null = fetchValue ? fetchValue.title : null
      const fetchedIconUrls: string[] = fetchValue ? fetchValue.iconUrls : []

      // 合并去重 iconUrls，保持后端优先顺序
      const seen = new Set<string>()
      const iconUrls: string[] = []
      for (const u of [...backendIconUrls, ...fetchedIconUrls]) {
        if (!seen.has(u)) {
          seen.add(u)
          iconUrls.push(u)
        }
      }
      iconCandidates.value = iconUrls

      // title 决策：优先 fetch 解析，失败回退域名提取，全失败为 null
      let title: string | null = null
      let usedDomainFallback = false
      if (fetchedTitle) {
        title = fetchedTitle
      } else {
        const domainTitle = extractTitleFromDomain(url)
        if (domainTitle) {
          title = domainTitle
          usedDomainFallback = true
        }
      }

      // toast 提示分支
      if (iconUrls.length > 0) {
        // 找到图标候选
        toast.success(`找到 ${iconUrls.length} 个图标候选`)
      } else {
        // 无候选：后端失败或后端返回空
        toast.error('获取图标失败')
      }
      // 附加提示：fetch 失败但能用域名提取 title
      if (usedDomainFallback) {
        toast.warning('无法获取站点标题，已从域名生成')
      }

      return { iconUrls, title }
    } catch {
      // 兜底网络异常
      toast.error('网络错误')
      return { iconUrls: [], title: null }
    } finally {
      getIconLoading.value = false
    }
  }

  function selectIcon(iconUrl: string): string {
    iconCandidates.value = []
    toast.success('已选择图标')
    return iconUrl
  }

  return {
    getIconLoading,
    iconCandidates,
    getIconByUrl,
    selectIcon,
  }
}
