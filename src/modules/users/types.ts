import type { UserRow, UserInfo } from '../../models/types'

// 重新导出数据库行类型，方便模块内统一引用
export type { UserRow, UserInfo }

// 用户列表单条记录（getList 映射后）
export interface UserListItem {
  id: number
  username: string
  name: string
  headImage: string
  status: number
  role: number
  mail: string
  createTime: string
  updateTime: string
}

// getList 响应
export interface UserListResponse {
  list: UserListItem[]
  total: number
  page: number
  pageSize: number
}

// POST /panel/users/create 请求体
export interface UserCreateBody {
  username: string
  password: string
  name?: string
  role?: number
  status?: number
}

// POST /panel/users/update 请求体（id 之外的字段可选）
export interface UserUpdateBody {
  id: number
  username?: string
  password?: string
  name?: string
  role?: number
  status?: number
}

// POST /panel/users/deletes 请求体
export interface UserDeleteBody {
  userIds: number[]
}

// POST /user/updateInfo 请求体
export interface UserNameUpdateBody {
  name: string
}

// POST /user/updatePassword 请求体
export interface UserPasswordUpdateBody {
  oldPassword: string
  newPassword: string
}

// POST /panel/users/setPublicVisitUser 请求体
export interface PublicVisitUserBody {
  userId: number | null
}
