import { post } from '@/utils/request'
import type { MusicParseParams, MusicTrack } from './types'

/** 解析歌单/单曲为可播放的曲目列表（后端代理 + 缓存） */
export function parseMusic(params: MusicParseParams) {
  return post<MusicTrack[]>({ url: '/panel/music/parse', data: params })
}
