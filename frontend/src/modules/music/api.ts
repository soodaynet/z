import type { MusicParseParams, MusicTrack } from './types'

/** 请求超时（毫秒） */
const FETCH_TIMEOUT = 3000
/** 最多解析曲目数 */
const MAX_TRACKS = 50
/** 单批并发数 */
const BATCH_SIZE = 10

/** Meting API 原始曲目项（字段可能缺失） */
interface RawMetingItem {
  id?: string | number
  name?: string
  artist?: string
  album?: string
  url_id?: string | number
  pic_id?: string | number
}

/** 带 3s 超时的 GET fetch */
async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 解析 url/pic 响应文本：去除首尾引号与空白 */
function parseMediaUrl(text: string): string {
  return text.trim().replace(/^["']|["']$/g, '')
}

/**
 * 直连 Meting API 解析歌单/单曲为可播放曲目列表。
 * 不走后端代理，浏览器直连上游。解析逻辑（列表 → 每首 url/pic）全部在前端完成。
 * 返回裸 MusicTrack[]（不再包装为 { code, msg, data }）。
 */
export async function parseMusic(params: MusicParseParams): Promise<MusicTrack[]> {
  const { server, type, id, apiUrl } = params
  // 1. 抓取曲目列表
  const listType = type === 'playlist' ? 'playlist' : 'single'
  const listUrl = `${apiUrl}?server=${server}&type=${listType}&id=${id}`
  const listRes = await fetchWithTimeout(listUrl)
  if (!listRes.ok) throw new Error(`歌单解析失败: ${listRes.status}`)
  const list = await listRes.json()
  if (!Array.isArray(list)) return []
  const top: RawMetingItem[] = list.slice(0, MAX_TRACKS)

  // 2. 分批并发抓取每首 url 与 pic，单首失败置空串
  const tracks: MusicTrack[] = []
  for (let i = 0; i < top.length; i += BATCH_SIZE) {
    const batch = top.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (item): Promise<MusicTrack> => {
        const urlId = item.url_id ?? item.id
        const picId = item.pic_id ?? item.id
        const [urlRes, picRes] = await Promise.allSettled([
          urlId != null ? fetchWithTimeout(`${apiUrl}?server=${server}&type=url&id=${urlId}`) : Promise.reject(new Error('no url_id')),
          picId != null ? fetchWithTimeout(`${apiUrl}?server=${server}&type=pic&id=${picId}`) : Promise.reject(new Error('no pic_id')),
        ])
        const url = urlRes.status === 'fulfilled' && urlRes.value.ok ? parseMediaUrl(await urlRes.value.text()) : ''
        const pic = picRes.status === 'fulfilled' && picRes.value.ok ? parseMediaUrl(await picRes.value.text()) : ''
        return {
          id: String(item.id ?? ''),
          name: item.name ?? '',
          artist: item.artist ?? '',
          album: item.album ?? '',
          url,
          pic,
          source: server,
        }
      }),
    )
    for (const r of results) {
      if (r.status === 'fulfilled') tracks.push(r.value)
    }
  }
  return tracks
}
