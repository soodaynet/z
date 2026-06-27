# 生成组件修改与新 UI 库引入登记表

本文件用于集中登记对 `frontend/src/components/ui/**` 生成组件的本地修改，以及新引入的 UI 库，便于追溯与审计。每次修改生成组件或引入新 UI 库时，除在代码处加注释 `// shadcn-vue 生成，本地修改：<说明>` 外，还需在本文件对应表格追加一行。

## 填写规范

- 修改生成组件：仅限视觉样式（颜色/尺寸/间距/圆角/阴影/透明度/边框/过渡动画等），不得改逻辑/props API/事件/插槽/a11y 语义
- 代码处须加中文注释：`// shadcn-vue 生成，本地修改：<说明>`
- 引入新 UI 库：需在 PR 说明中给出明确理由
- 日期格式：YYYY-MM-DD

## 生成组件修改登记表

| 序号 | 文件路径 | 修改类型 | 说明 | 日期 |
| - | - | - | - | - |
| 1 | frontend/src/components/ui/card/Card.vue | 视觉样式 | 圆角由 `rounded-xl` 调整为 `rounded-lg`，与 DialogContent 圆角统一，符合 spec「dialog/card 用 rounded-lg」要求；阴影 `shadow-sm` 保持不变 | 2026-06-26 |

## 新 UI 库引入登记表

| 序号 | 库名 | 版本 | 引入理由 | 日期 |
| - | - | - | - | - |

_暂无引入_

## shadcn-vue 子组件删除登记表

登记 shadcn-vue CLI 顺带生成但本仓库业务代码未使用的子组件删除（spec: comprehensive-perf-optimization Task 22）。删除前已 Grep 二次确认全仓无业务 import，仅 `components/ui/<name>/index.ts` 内部导出。删除同步移除对应 `index.ts` 导出行。

| 序号 | 文件路径 | 删除原因 | 日期 |
| - | - | - | - |
| 1 | frontend/src/components/ui/dialog/DialogScrollContent.vue | CLI 顺带生成，业务无滚动内容 Dialog 场景 | 2026-06-27 |
| 2 | frontend/src/components/ui/dialog/DialogTrigger.vue | 业务统一用 `v-model:open` 控制，不用 Trigger | 2026-06-27 |
| 3 | frontend/src/components/ui/select/SelectGroup.vue | 业务 Select 项无分组需求 | 2026-06-27 |
| 4 | frontend/src/components/ui/select/SelectLabel.vue | 业务 Select 项无分组标签需求 | 2026-06-27 |
| 5 | frontend/src/components/ui/select/SelectScrollDownButton.vue | Reka UI 内置滚动，无需自定义按钮 | 2026-06-27 |
| 6 | frontend/src/components/ui/select/SelectScrollUpButton.vue | Reka UI 内置滚动，无需自定义按钮 | 2026-06-27 |
| 7 | frontend/src/components/ui/select/SelectSeparator.vue | 业务 Select 项无分隔需求 | 2026-06-27 |
| 8 | frontend/src/components/ui/table/TableCaption.vue | 业务表格无标题说明需求 | 2026-06-27 |
| 9 | frontend/src/components/ui/table/TableEmpty.vue | 业务空态由调用方自行渲染 | 2026-06-27 |
| 10 | frontend/src/components/ui/dropdown-menu/DropdownMenuGroup.vue | 业务下拉菜单无分组需求 | 2026-06-27 |
| 11 | frontend/src/components/ui/dropdown-menu/DropdownMenuLabel.vue | 业务下拉菜单无标签需求 | 2026-06-27 |
| 12 | frontend/src/components/ui/dropdown-menu/DropdownMenuSeparator.vue | 业务下拉菜单无分隔需求 | 2026-06-27 |

## 后端共享工具新增登记表

登记后端 `src/modules/shared/` 下新增的工具文件（非 shadcn-vue 生成组件，但为统一追溯一并登记）。

| 序号 | 文件路径 | 类型 | 说明 | 日期 |
| - | - | - | - | - |
| 1 | src/modules/shared/cache.ts | 新增 | 极简 TTL 内存缓存，用于 publicModeMiddleware / settings.getAll / 后续读多写少场景；不持久化，无 KV/R2 依赖 | 2026-06-27 |
| 2 | src/modules/shared/userFormatter.ts | 新增 | 合并 auth/users service 重复的 formatUserInfo + USER_SELECT 常量 | 2026-06-27 |

## schema.sql 与 migrations 变更登记表

登记 `schema.sql` 索引调整与对应增量迁移脚本（spec: comprehensive-perf-optimization Task 6）。

| 序号 | 变更类型 | 路径 | 说明 | 日期 |
| - | - | - | - | - |
| 1 | 新增索引 | schema.sql + migrations/2026-06-27-add-group-sort-index.sql | `CREATE INDEX idx_item_icon_groups_user_sort ON item_icon_groups(user_id, sort, id)`，覆盖 getGroupList / getAllData 热点查询 | 2026-06-27 |
| 2 | 移除冗余索引 | schema.sql + migrations/2026-06-27-add-group-sort-index.sql | `DROP INDEX idx_item_icons_group_id`（被 idx_item_icons_group_user 复合索引左前缀覆盖） | 2026-06-27 |
| 3 | 移除死索引 | schema.sql + migrations/2026-06-27-add-group-sort-index.sql | `DROP INDEX idx_users_token`（全仓无 WHERE token = ? 查询） | 2026-06-27 |
