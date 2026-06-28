import { AppError } from '../shared/errors'
import { isValidUrl } from '../shared/favicon'
import type { MusicParseParams, MusicTrack } from './types'

// ========== 常量 ==========

/** 缓存 TTL：30 分钟 */
const CACHE_TTL = 1_800_000
/** 单次 fetch 超时：3 秒 */
const FETCH_TIMEOUT = 3000
/** 响应文本大小上限：512KB */
const MAX_RESPONSE_SIZE = 524288
/** 最多曲目数 */
const MAX_TRACKS = 50
/** 单批并发数 */
const BATCH_SIZE = 10

// ========== 内存缓存（isolate 级，重启清空）==========

interface CacheEntry {
  data: MusicTrack[]
  expireAt: number
}

const cache = new Map<string, CacheEntry>()

// ========== Meting 原始响应类型 ==========

interface MetingItem {
  id?: string | number
  name?: string
  artist?: string
  album?: string
  pic_id?: string | number
  url_id?: string | number
}

// ========== 辅助函数 ==========

/**
 * 带超时的 GET 请求
 * - 仅 GET，3s 超时（AbortController）
 * - 响应文本大小限制 512KB，超出抛错
 */
async function fetchWithTimeout(url: string): Promise<string> {
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: abort.signal,
      redirect: 'follow',
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const text = await res.text()
    if (text.length > MAX_RESPONSE_SIZE) {
      throw new Error('响应过大')
    }
    return text
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * 解析 url/pic 接口响应为 URL 字符串
 * 处理可能的 JSON 字符串字面量（如 "http://..."）与首尾空白
 */
function parseUrlResponse(text: string): string {
  let s = text.trim()
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1)
  }
  return s
}

/**
 * 抓取单首曲目的真实播放 URL 与封面 URL
 * - url/pic 并发请求（Promise.allSettled 容错）
 * - 任一失败置空字符串，整体不抛错
 */
async function fetchTrackUrls(
  apiUrl: string,
  server: string,
  item: MetingItem,
): Promise<{ url: string; pic: string }> {
  // 拼接 url/pic 抓取地址，缺失 id 时返回空串跳过请求
  const buildUrl = (type: 'url' | 'pic', resId: string | number | undefined): string => {
    if (resId === undefined || resId === null || String(resId) === '') return ''
    return `${apiUrl}?server=${encodeURIComponent(server)}&type=${type}&id=${encodeURIComponent(String(resId))}`
  }

  const urlTarget = buildUrl('url', item.url_id)
  const picTarget = buildUrl('pic', item.pic_id)

  // 并发抓取 url 与 pic，用 Promise.allSettled 容错
  const tasks: Promise<string>[] = [
    urlTarget ? fetchWithTimeout(urlTarget).then(parseUrlResponse) : Promise.resolve(''),
    picTarget ? fetchWithTimeout(picTarget).then(parseUrlResponse) : Promise.resolve(''),
  ]
  const results = await Promise.allSettled(tasks)
  const url = results[0].status === 'fulfilled' ? results[0].value : ''
  const pic = results[1].status === 'fulfilled' ? results[1].value : ''
  return { url, pic }
}

// ========== 主入口 ==========

/**
 * 解析音乐：从 Meting API 抓取曲目列表，并逐首获取真实播放 URL 与封面
 *
 * 步骤：
 * 1. SSRF 校验 apiUrl
 * 2. 命中内存缓存直接返回
 * 3. 抓取曲目列表（3s 超时，≤512KB）
 * 4. 解析 JSON 数组，取前 50 项
 * 5. 分批（每批 10 首）并发抓取每首 url/pic
 * 6. 写入缓存并返回
 */
export async function parseMusic(params: MusicParseParams): Promise<MusicTrack[]> {
  const { server, type, id, apiUrl } = params

  // 1. SSRF 校验 API 地址
  if (!isValidUrl(apiUrl)) {
    throw AppError.badRequest('不合法的 API 地址')
  }

  // 2. 命中缓存直接返回
  const cacheKey = `${apiUrl}|${server}|${type}|${id}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expireAt > Date.now()) {
    return cached.data
  }

  // 3. 抓取曲目列表（song → single，playlist → playlist）
  const metingType = type === 'playlist' ? 'playlist' : 'single'
  const listUrl = `${apiUrl}?server=${encodeURIComponent(server)}&type=${metingType}&id=${encodeURIComponent(id)}`
  let listText: string
  try {
    listText = await fetchWithTimeout(listUrl)
  } catch {
    throw new AppError(500, '音乐解析失败', 500)
  }

  // 4. 解析 JSON，期望为数组
  let items: MetingItem[]
  try {
    const parsed = JSON.parse(listText)
    if (!Array.isArray(parsed)) {
      throw new Error('not array')
    }
    items = parsed as MetingItem[]
  } catch {
    throw new AppError(500, '音乐解析失败', 500)
  }

  // 最多取前 50 项
  const limited = items.slice(0, MAX_TRACKS)

  // 5. 分批并发抓取每首 url/pic（每批 10 首）
  const tracks: MusicTrack[] = []
  for (let i = 0; i < limited.length; i += BATCH_SIZE) {
    const batch = limited.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const { url, pic } = await fetchTrackUrls(apiUrl, server, item)
        const track: MusicTrack = {
          id: String(item.id ?? ''),
          name: item.name ?? '',
          artist: item.artist ?? '',
          album: item.album ?? '',
          url,
          pic,
          source: server,
        }
        return track
      }),
    )
    for (const r of results) {
      if (r.status === 'fulfilled') {
        tracks.push(r.value)
      }
    }
  }

  // 6. 写入缓存
  cache.set(cacheKey, { data: tracks, expireAt: Date.now() + CACHE_TTL })

  return tracks
}
