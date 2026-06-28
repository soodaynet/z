import { z } from 'zod'

/** hitokoto 分类枚举（c 参数可选值） */
const hitokotoCategories = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
] as const

/** 一言请求参数校验 schema */
export const hitokotoParamsSchema = z.object({
  apiUrl: z.string().optional(),
  categories: z.array(z.enum(hitokotoCategories)).optional(),
  minLength: z.number().min(0).max(200).optional(),
  maxLength: z.number().min(0).max(200).optional(),
})
