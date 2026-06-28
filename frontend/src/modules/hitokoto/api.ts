import type { HitokotoParams, HitokotoData } from './types'

/** 一言上游默认地址 */
const DEFAULT_HITOKOTO_API = 'https://v1.hitokoto.cn/'

/**
 * 获取一条随机一言（前端直连上游，不经过后端代理）。
 * 上游需支持 CORS。默认 https://v1.hitokoto.cn/ 已开启 CORS。
 */
export async function getHitokoto(params?: HitokotoParams): Promise<HitokotoData> {
  const apiUrl = (params?.apiUrl || DEFAULT_HITOKOTO_API).trim()
  const url = new URL(apiUrl)
  if (params?.categories?.length) {
    for (const c of params.categories) url.searchParams.append('c', c)
  }
  if (typeof params?.minLength === 'number') url.searchParams.set('min_length', String(params.minLength))
  if (typeof params?.maxLength === 'number') url.searchParams.set('max_length', String(params.maxLength))

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const res = await fetch(url.toString(), { method: 'GET', signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = (await res.json()) as Partial<HitokotoData>
    return {
      id: Number(raw.id) || 0,
      hitokoto: raw.hitokoto ?? '',
      from: raw.from ?? '',
      from_who: raw.from_who ?? '',
      uuid: raw.uuid ?? '',
      type: raw.type ?? '',
    }
  } finally {
    clearTimeout(timer)
  }
}
