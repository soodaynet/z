import { post } from '@/utils/request'
import type { HitokotoParams, HitokotoData } from './types'

/** 获取一条随机一言（后端代理 + 缓存） */
export function getHitokoto(params?: HitokotoParams) {
  return post<HitokotoData>({ url: '/panel/hitokoto/get', data: params ?? {} })
}
