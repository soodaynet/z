import type { z } from 'zod'
import type { SystemSettingRow } from '../shared/types'
import type { settingGetSchema, settingSetSchema, saveAllSchema } from './validator'

// 重新导出数据库行类型，方便模块内统一引用
export type { SystemSettingRow }

// 所有设置的键值对响应（config_name -> config_value）
export type SettingResponse = Record<string, string>

// POST /system/setting/get 请求体
export type SettingGetBody = z.infer<typeof settingGetSchema>

// POST /system/setting/set 请求体
export type SettingSetBody = z.infer<typeof settingSetSchema>

// POST /system/settings/saveAll 请求体
export type SettingSaveAllBody = z.infer<typeof saveAllSchema>
