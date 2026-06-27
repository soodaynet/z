import type { UserRow } from './types'

/** 用户查询字段（含 password 用于校验） */
export const USER_SELECT =
  'SELECT id, username, password, name, head_image, status, role, mail, created_at, updated_at FROM users'

/** 将数据库行格式化为前端需要的用户信息对象 */
export function formatUserInfo(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    name: row.name || '',
    headImage: row.head_image || '',
    status: row.status,
    role: row.role,
    mail: row.mail || '',
    created_at: row.created_at,
  }
}
