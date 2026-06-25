/**
 * 业务模块统一导出
 * 新结构：按功能拆分模块，每个模块包含 api.ts 与 types.ts
 * 原有 src/api/ 目录暂保留以兼容未迁移的页面
 */

// auth
export { login } from './auth/api'

// panel
export {
  getAllData,
  getGroupList,
  saveGroup,
  deleteGroups,
  saveGroupSort,
  addItems,
  editItem,
  getItemsByGroup,
  deleteItems,
  saveItemSort,
  getSiteFavicon,
} from './panel/api'

// users
export {
  getUserConfig,
  setUserConfig,
  getAuthInfo,
  updateUserInfo,
  updatePassword,
  getUserList,
  createUser,
  updateUser,
  deleteUsers,
  getPublicVisitUser,
  setPublicVisitUser,
} from './users/api'

// settings
export {
  getSystemSetting,
  setSystemSetting,
  getAbout,
  saveSiteSettings,
  getInit,
} from './settings/api'

// types
export type {
  LoginRequest,
  LoginResponse,
  UserInfo as AuthUserInfo,
} from './auth/types'

export type {
  AllDataResponse,
  ItemIcon,
  ItemIconGroup,
  ItemIconSortRequest,
  ItemInfo,
  PanelConfig,
  PanelConfigStyleEnum,
  SiteFaviconResponse,
  SortItemRequest,
} from './panel/types'

export type {
  PublicVisitUserResponse,
  UserConfig,
  UserFormData,
  UserInfo,
  UserListResponse,
} from './users/types'

export type {
  AboutResponse,
  SiteSettings,
  SystemSetting,
} from './settings/types'
