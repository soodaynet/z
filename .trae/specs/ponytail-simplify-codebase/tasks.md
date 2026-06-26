# Tasks

- [x] Task 1: 补齐后端共享层
  - [x] SubTask 1.1: 新建 `src/modules/shared/types.ts`，迁入 `src/models/types.ts` 的 `UserRow/ItemIconGroupRow/ItemIconRow/SystemSettingRow/UserInfo/ApiResponse`（删除 `src/models/types.ts` 前置依赖）
  - [x] SubTask 1.2: 新建 `src/modules/shared/favicon.ts`，迁入 `src/utils/favicon.ts` 的 `isValidUrl`

- [x] Task 2: 迁移后端模块跨依赖（断开对旧目录的引用）
  - [x] SubTask 2.1: `src/modules/shared/response.ts` 的 `ApiResponse` 改从 `./types` 导入
  - [x] SubTask 2.2: `src/modules/shared/validate.ts` 移除所有 `export { ... } from '../../validators/*'` re-export；`validate()` 改为 `MiddlewareHandler<AppContext>`，移除本地 `Variables` 导出
  - [x] SubTask 2.3: 各模块 `validator.ts` 自包含 schema（schema 已在各模块 validator.ts，仅删除 shared/validate.ts 的 re-export）
  - [x] SubTask 2.4: 各模块 `../../models/types` 引用改为 `../shared/types`
  - [x] SubTask 2.5: `src/modules/panel/service.ts` 的 `../../utils/favicon` 引用改为 `../shared/favicon`
  - [x] SubTask 2.6: `src/modules/init/service.ts` 与 `src/modules/init/routes.ts` 移除 `ServiceFactory` 依赖，改用直接 `new PanelService(c.env.DB)` / `new SettingsService(c.env.DB)`
  - [x] SubTask 2.7: `src/modules/users/routes.ts` 的 `../../services/SettingsService` 引用改为 `../settings/service`（含移植 getPublicVisitUser/setPublicVisitUser 到新 settings service）

- [x] Task 3: 删除后端旧目录与死 barrel
  - [x] SubTask 3.1: 删除 `src/routes/`（7 文件）
  - [x] SubTask 3.2: 删除 `src/middleware/`（6 文件）
  - [x] SubTask 3.3: 删除 `src/services/`（4 文件）
  - [x] SubTask 3.4: 删除 `src/utils/`（10 文件）
  - [x] SubTask 3.5: 删除 `src/validators/`（4 文件）
  - [x] SubTask 3.6: 删除 `src/models/`
  - [x] SubTask 3.7: 删除 `src/modules/shared/index.ts`（barrel）

- [x] Task 4: 修复后端类型债务与死方法
  - [x] SubTask 4.1: `src/modules/types.ts` 的 `AppContext.Variables` 增补 `authUser?` 与 `validatedBody?`（AuthUser 移至 shared/types.ts 断循环依赖）
  - [x] SubTask 4.2: 重写 `src/modules/shared/middleware/auth.ts`：中间件改 `MiddlewareHandler<AppContext>`，`getAuthUser` 参数 `Context<AppContext>`，移除 `optionalAuthMiddleware`，无 `as any`
  - [x] SubTask 4.3: 所有 routes.ts 移除 `as any`，`c.get('validatedBody')` 统一为 `c.var.validatedBody`
  - [x] SubTask 4.4: `src/modules/registry.ts` 移除 `get()`、`list()`
  - [x] SubTask 4.5: `errors.ts` 移除 `AppError.internal()`；`jwt.ts` 移除 `JwtPayload/SignOptions`；`env.ts` 不导出 `EnvVars`
  - [x] SubTask 4.6: 5 个模块 `index.ts` 移除 `export default`
  - [x] SubTask 4.7: `users/types.ts`、`panel/types.ts` 移除未使用请求体类型

- [x] Task 5: 前端清理与语言切换接通
  - [x] SubTask 5.1: 删除 `frontend/src/api/`（5 文件）
  - [x] SubTask 5.2: 删除 `frontend/src/hooks/useLanguage.ts`
  - [x] SubTask 5.3: 删除 `frontend/src/components/ui/{checkbox,tabs,textarea}/`
  - [x] SubTask 5.4: `frontend/package.json` 移除 `@types/node`
  - [x] SubTask 5.5: `app` store `setLanguage` 同步 `i18n.global.locale.value`
  - [x] SubTask 5.6: 精简 `modules/index.ts` barrel；移除 `locales/index.ts` 的 `t()`、各 `api.ts` 未使用导出、`faviconUtils` 的 `detectFaviconType` 导出与 `SITE_CACHE_KEY` re-export、`importExport.ts` 的 `ExportItem` 导出、`typings/index.d.ts` 死类型
  - [x] SubTask 5.7: 确认 `modules/auth/types.ts`、`modules/settings/types.ts` 非孤儿（api.ts 内部引用），保留

- [x] Task 6: 全量验证
  - [x] SubTask 6.1: `pnpm install`（lockfile 更新）
  - [x] SubTask 6.2: `pnpm run typecheck`（后端）通过
  - [x] SubTask 6.3: `pnpm --filter sun-panel-frontend run typecheck`（前端）通过
  - [x] SubTask 6.4: `pnpm run lint` 通过（0 错误）
  - [x] SubTask 6.5: `pnpm --filter sun-panel-frontend run build` 通过
  - [x] SubTask 6.6: `pnpm run deploy:dry` 通过
  - [x] SubTask 6.7: Grep 确认 `src/modules/**` 无对 `../../{models,services,utils,validators}` 引用残留；无 `as any` 于 routes.ts；无 `c.get('validatedBody')`
  - [x] SubTask 6.8: Grep 确认无 `useLanguage` 残留、无 `@types/node` 于 frontend/package.json、旧目录已删

# Task Dependencies
- Task 2 依赖 Task 1（shared/types、shared/favicon 先建）
- Task 3 依赖 Task 2（断开跨依赖后才能删旧目录）
- Task 4 与 Task 2 可同文件协同（routes.ts 同时改导入与去 as any），但 4.2 中间件泛型化需先于 4.3
- Task 5 与后端 Task 1-4 完全独立，可并行
- Task 6 依赖 Task 1-5 全部完成
