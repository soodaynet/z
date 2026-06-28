import { z } from 'zod'

export const musicParseSchema = z.object({
  server: z.enum(['netease', 'tencent', 'kugou', 'baidu', 'kuwo']),
  type: z.enum(['song', 'playlist']),
  id: z.string().min(1, 'id 不能为空'),
  apiUrl: z.string().min(1, 'apiUrl 不能为空'),
})
