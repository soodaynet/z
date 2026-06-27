import type { z } from 'zod'
import type { loginSchema } from './validator'

export type LoginRequest = z.infer<typeof loginSchema>

export interface LoginResponse {
  token: string
  userInfo: {
    id: number
    username: string
    name: string
    headImage: string
    status: number
    role: number
    mail: string
    created_at: string
  }
}
