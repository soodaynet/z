import { isValidUrl } from '../shared/favicon'
import { AppError } from '../shared/errors'
import type { HitokotoParams, HitokotoData } from './types'

/** 默认上游 API 地址 */
const DEFAULT_API_URL = 'https://v1.hitokoto.cn/'

/** 缓存 TTL：5 分钟（300_000 ms） */
const CACHE_TTL = 300_000

/** 上游请求超时：3 秒 */
const FETCH_TIMEOUT = 3000

/** 响应体大小上限：4KB */
const MAX_RESPONSE_SIZE = 4096

/** isolate 级内存缓存（重启清空，可接受） */
const cache = new Map<string, { data: HitokotoData; expireAt: number }>()

/** 构造缓存 key：apiUrl|categories|minLength|maxLength */
function buildCacheKey(params: HitokotoParams, apiUrl: string): string {
  return [
    apiUrl,
    (params.categories ?? []).join(','),
    String(params.minLength ?? ''),
    String(params.maxLength ?? ''),
  ].join('|')
}

/** 构造上游请求 URL：categories 多次 c=，minLength/maxLength 仅在非 undefined 时拼接 */
function buildUpstreamUrl(params: HitokotoParams, apiUrl: string): string {
  const url = new URL(apiUrl)
  for (const c of params.categories ?? []) {
    url.searchParams.append('c', c)
  }
  if (params.minLength !== undefined) {
    url.searchParams.set('min_length', String(params.minLength))
  }
  if (params.maxLength !== undefined) {
    url.searchParams.set('max_length', String(params.maxLength))
  }
  return url.toString()
}

/**
 * 获取一言数据
 *
 * 流程：
 * 1. 校验 apiUrl（默认 v1.hitokoto.cn），不合法抛 400
 * 2. 命中 isolate 级缓存（TTL 5 分钟）直接返回
 * 3. 仅 GET 请求上游，3s 超时（AbortController），响应 ≤ 4KB
 * 4. fetch 失败/超时/非 2xx/响应过大 → 抛 500
 * 5. 解析 JSON 提取标准字段（缺失给默认值），写入缓存并返回
 *
 * @param params 一言请求参数
 */
export async function getHitokoto(params: HitokotoParams): Promise<HitokotoData> {
  const apiUrl = params.apiUrl ?? DEFAULT_API_URL
  if (!isValidUrl(apiUrl)) {
    throw AppError.badRequest('不合法的 API 地址')
  }

  // 缓存命中且未过期 → 直接返回
  const cacheKey = buildCacheKey(params, apiUrl)
  const cached = cache.get(cacheKey)
  if (cached && cached.expireAt > Date.now()) {
    return cached.data
  }

  const upstreamUrl = buildUpstreamUrl(params, apiUrl)

  // 仅 GET，3s 超时
  let res: Response
  try {
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), FETCH_TIMEOUT)
    try {
      res = await fetch(upstreamUrl, {
        method: 'GET',
        signal: abort.signal,
        redirect: 'follow',
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    throw new AppError(500, '一言服务暂不可用', 500)
  }

  if (!res.ok) {
    throw new AppError(500, '一言服务暂不可用', 500)
  }

  let text: string
  try {
    text = await res.text()
  } catch {
    throw new AppError(500, '一言服务暂不可用', 500)
  }

  // 响应限制 ≤ 4KB
  if (text.length > MAX_RESPONSE_SIZE) {
    throw new AppError(500, '一言服务暂不可用', 500)
  }

  let json: Record<string, unknown>
  try {
    json = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new AppError(500, '一言服务暂不可用', 500)
  }

  // 提取标准字段，缺失给默认值
  const data: HitokotoData = {
    id: typeof json.id === 'number' ? json.id : 0,
    hitokoto: typeof json.hitokoto === 'string' ? json.hitokoto : '',
    from: typeof json.from === 'string' ? json.from : '',
    from_who: typeof json.from_who === 'string' ? json.from_who : '',
    uuid: typeof json.uuid === 'string' ? json.uuid : '',
    type: typeof json.type === 'string' ? json.type : '',
  }

  // 写入缓存
  cache.set(cacheKey, { data, expireAt: Date.now() + CACHE_TTL })
  return data
}
