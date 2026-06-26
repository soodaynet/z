# 验证清单

## 共享层补齐
- [x] `src/modules/shared/types.ts` 存在并导出 `UserRow/ItemIconGroupRow/ItemIconRow/SystemSettingRow/UserInfo/ApiResponse`
- [x] `src/modules/shared/favicon.ts` 存在并导出 `isValidUrl`

## 后端跨依赖迁移
- [x] `src/modules/shared/response.ts` 的 `ApiResponse` 来自 `./types`
- [x] `src/modules/shared/validate.ts` 无 `../../validators/*` re-export，`validate()` 为 `MiddlewareHandler<AppContext>`，无本地 `Variables` 导出
- [x] 每个模块 `validator.ts` 自包含 schema，`src/validators/*` 引用为 0
- [x] `src/modules/**` 中 `../../models/types` 引用为 0
- [x] `src/modules/**` 中 `../../utils/favicon` 引用为 0
- [x] `src/modules/init/**` 无 `ServiceFactory` 引用，改用直接实例化
- [x] `src/modules/users/routes.ts` 的 `SettingsService` 来自 `../settings/service`

## 旧目录删除
- [x] `src/routes/` 已删除
- [x] `src/middleware/` 已删除
- [x] `src/services/` 已删除
- [x] `src/utils/` 已删除
- [x] `src/validators/` 已删除
- [x] `src/models/` 已删除
- [x] `src/modules/shared/index.ts` 已删除
- [x] `frontend/src/api/` 已删除

## 类型债务与死方法
- [x] `AppContext.Variables` 含可选 `authUser` 与 `validatedBody`
- [x] `src/modules/shared/middleware/auth.ts` 中间件为 `MiddlewareHandler<AppContext>`，无 `as any`，无 `optionalAuthMiddleware`
- [x] `src/modules/**/routes.ts` 中 `as any` 为 0
- [x] `src/modules/**/routes.ts` 中 `c.get('validatedBody')` 为 0，统一 `c.var.validatedBody`
- [x] `ModuleRegistry` 无 `get()`/`list()`
- [x] `AppError.internal()` 已移除
- [x] `jwt.ts` 无 `JwtPayload/SignOptions` 导出
- [x] `env.ts` 不导出 `EnvVars`
- [x] 5 个模块 `index.ts` 无 `export default`
- [x] `users/types.ts`、`panel/types.ts` 无未使用请求体类型

## 前端清理与语言切换
- [x] `frontend/src/hooks/useLanguage.ts` 已删除，`useLanguage` 引用残留为 0
- [x] `frontend/src/components/ui/{checkbox,tabs,textarea}/` 已删除
- [x] `frontend/package.json` 无 `@types/node`
- [x] `app` store `setLanguage` 同步 `i18n.global.locale.value`
- [x] `frontend/src/modules/index.ts` 仅保留实际被消费的 re-export
- [x] `locales/index.ts` 无 `t()`；各 `api.ts`/`utils` 无未使用导出；`typings/index.d.ts` 无死类型
- [x] 孤儿 `modules/auth/types.ts`、`modules/settings/types.ts` 已确认非孤儿（api.ts 内部引用），保留

## 全量验证
- [x] `pnpm run typecheck`（后端）通过
- [x] `pnpm --filter sun-panel-frontend run typecheck`（前端）通过
- [x] `pnpm run lint` 通过（0 错误）
- [x] `pnpm --filter sun-panel-frontend run build` 通过
- [x] `pnpm run deploy:dry` 通过
