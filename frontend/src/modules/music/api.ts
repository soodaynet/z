import type { MusicParseParams, MusicTrack } from './types'

/** Meting API 默认地址（参考 Mizuki） */
const DEFAULT_METING_API = 'https://api.moeyao.cn/meting/'

/** 单次请求超时（毫秒） */
const FETCH_TIMEOUT = 8000

/** 带 AbortController 超时的 fetch 封装 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

/** 轻量解析 Meting 返回（兼容 JSON 字符串字面量） */
function parseTextValue(text: string): string {
  const trimmed = text.trim()
  // 去除首尾引号（Meting url/pic 端点常返回 "https://..." 形式）
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * 解析歌单/单曲为可播放的曲目列表（前端直连 Meting API，不经过后端代理）。
 * 上游需支持 CORS。
 *
 * 实现：
 * 1. 列表请求：`${apiUrl}?server=${server}&type=${playlist|single}&id=${id}`
 *    返回 JSON 数组，每项含 { id, name, artist, album, url, pic, url_id, pic_id }
 * 2. 对每首曲目，若 url/pic 字段为空，则并发请求 `?type=url&id=<url_id>` 与 `?type=pic&id=<pic_id>`
 * 3. 最多取前 50 首，分批 10 首并发，单首失败置空字符串
 */
export async function parseMusic(params: MusicParseParams): Promise<MusicTrack[]> {
  const { server, type, id, apiUrl } = params
  const base = (apiUrl || DEFAULT_METING_API).trim()
  const metingType = type === 'song' ? 'single' : 'playlist'

  // 1. 抓取列表
  const listUrl = `${base}?server=${encodeURIComponent(server)}&type=${metingType}&id=${encodeURIComponent(id)}`
  const listRes = await fetchWithTimeout(listUrl)
  const listText = await listRes.text()
  let list: Array<Record<string, unknown>> = []
  try {
    list = JSON.parse(listText)
    if (!Array.isArray(list)) list = []
  } catch {
    list = []
  }
  if (list.length === 0) return []

  // 取前 50 首
  const items = list.slice(0, 50)

  // 2. 标准化每首，必要时补抓 url/pic
  const tracks: MusicTrack[] = []
  for (let i = 0; i < items.length; i += 10) {
    const batch = items.slice(i, i + 10)
    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const urlId = String(item.url_id ?? item.id ?? '')
        const picId = String(item.pic_id ?? item.id ?? '')
        let url = String(item.url ?? '')
        let pic = String(item.pic ?? '')
        // 仅当缺失时补抓，避免请求爆炸
        const tasks: Array<Promise<void>> = []
        if (!url && urlId) {
          tasks.push(
            fetchWithTimeout(`${base}?server=${encodeURIComponent(server)}&type=url&id=${encodeURIComponent(urlId)}`)
              .then((r) => r.text())
              .then((t) => {
                url = parseTextValue(t)
              })
              .catch(() => {
                /* 单首失败置空 */
              }),
          )
        }
        if (!pic && picId) {
          tasks.push(
            fetchWithTimeout(`${base}?server=${encodeURIComponent(server)}&type=pic&id=${encodeURIComponent(picId)}`)
              .then((r) => r.text())
              .then((t) => {
                pic = parseTextValue(t)
              })
              .catch(() => {
                /* 单首封面失败置空 */
              }),
          )
        }
        await Promise.all(tasks)
        return {
          id: String(item.id ?? urlId ?? ''),
          name: String(item.name ?? ''),
          artist: String(item.artist ?? ''),
          album: String(item.album ?? ''),
          url,
          pic,
          source: server,
        } satisfies MusicTrack
      }),
    )
    for (const r of settled) {
      if (r.status === 'fulfilled') tracks.push(r.value)
    }
  }

  return tracks
}
