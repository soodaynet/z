# Ponytail 全仓库审计与精简 Spec

## Why
当前仓库处于**半完成的模块化迁移状态**：新架构 `src/modules/` 已存在，但旧目录 `src/{routes,middleware,services,utils,validators,models}/` 与 `frontend/src/api/` 仍被 git 跟踪。其中 `src/routes/`、`src/middleware/`、`frontend/src/api/` 已完全死代码（仅自引用或零引用），而 `src/services/`、`src/utils/`、`src/validators/`、`src/models/` 仍被新模块反向依赖，导致迁移无法收尾。同时存在 33 处 `as any` 类型债务、`ModuleRegistry.get/list` 等死方法、孤立 `useLanguage` hook 等过度设计/死代码。ponytail 原则要求：先复用/集中真正共享的部分，再删除一切死代码与投机抽象，用最短 diff 收尾迁移。

## What Changes
- **补齐共享层**：新建 `src/modules/shared/types.ts`（集中 DB 行类型 `UserRow/ItemIconRow/ItemIconGroupRow/SystemSettingRow/UserInfo/ApiResponse`）与 `src/modules/shared/favicon.ts`（`isValidUrl`），作为模块间唯一共享通道。
- **迁移跨依赖**：所有 `src/modules/**` 对 `../../{models,services,utils,validators}/*` 的引用改为从 `../shared/types`、`../shared/favicon`、各模块自身 `validator.ts`/`service.ts` 取；`src/modules/shared/validate.ts` 不再 re-export `../../validators/*`，各模块 `validator.ts` 自包含 schema；`init` 模块改用直接 `new PanelService(c.env.DB)` / `new SettingsService(c.env.DB)`，移除 `ServiceFactory` 依赖；`users/routes.ts` 改从 `../settings/service` 导入 `SettingsService`。
- **删除旧目录（BREAKING，仅删除死代码）**：`src/routes/`、`src/middleware/`、`src/services/`、`src/utils/`、`src/validators/`、`src/models/`、`frontend/src/api/`、`src/modules/shared/index.ts`（无人引用的 barrel）。
- **修复类型债务**：`src/modules/shared/middleware/auth.ts` 中间件改为 `MiddlewareHandler<AppContext>`，`getAuthUser` 参数改为 `Context<AppContext>`，消除全部 33 处 `as any`；`validate.ts` 改为 `MiddlewareHandler<AppContext>` 并移除本地 `Variables` 导出；`AppContext.Variables` 增补 `authUser?` 与 `validatedBody?`；统一 `c.get('validatedBody')` → `c.var.validatedBody`。
- **删除死方法/死导出**：`ModuleRegistry.get()`、`ModuleRegistry.list()`；`AppError.internal()`；`jwt.ts` 的 `JwtPayload/SignOptions`；`env.ts` 的 `EnvVars` 导出；5 个模块 `index.ts` 的 `export default`；`users/types.ts`、`panel/types.ts` 未使用请求体类型。
- **前端清理**：删除 `frontend/src/api/`（死）、`frontend/src/hooks/useLanguage.ts`（孤立）、`frontend/src/components/ui/{checkbox,tabs,textarea}/`（零引用）、`frontend/package.json` 的 `@types/node`（未用）；`app` store `setLanguage` 同步 `i18n.global.locale.value` 接通语言切换；精简 `frontend/src/modules/index.ts` barrel 至实际被消费的 re-export；移除各 `api.ts`/`utils` 未使用导出与 `typings/index.d.ts` 死类型。

## Impact
- Affected specs: 无前置 spec（`.trae/specs/cleanup-optimize-codebase` 已不在磁盘）。本 spec 为独立收尾。
- Affected code:
  - 后端：`src/modules/shared/{types,favicon,middleware/auth,validate,response,index}.ts`、`src/modules/registry.ts`、`src/modules/types.ts`、各模块 `{index,routes,service,types,validator}.ts`、删除 `src/{routes,middleware,services,utils,validators,models}/`
  - 前端：`frontend/src/{api,hooks/useLanguage,components/ui/{checkbox,tabs,textarea},store/modules/app,modules/index,modules/*/api.ts,modules/*/types.ts,utils/*,typings/index.d.ts}`、`frontend/package.json`

## ADDED Requirements
### Requirement: 集中共享类型与 SSRF 校验
系统 SHALL 在 `src/modules/shared/types.ts` 集中 DB 行类型（`UserRow/ItemIconRow/ItemIconGroupRow/SystemSettingRow/UserInfo/ApiResponse`），在 `src/modules/shared/favicon.ts` 提供 `isValidUrl`，作为模块间唯一共享通道，避免跨模块重复定义。

#### Scenario: 模块取类型
- **WHEN** 任意模块需要 DB 行类型
- **THEN** 从 `../shared/types` 导入，不得从已删除的 `../../models/types` 导入

### Requirement: 语言切换即时生效
系统 SHALL 在 `app` store 的 `setLanguage` action 中同步设置 `i18n.global.locale.value`，使语言切换无需刷新即时生效。

#### Scenario: 切换语言
- **WHEN** 用户点击语言切换按钮调用 `appStore.setLanguage(lang)`
- **THEN** `i18n.global.locale.value` 立即更新为对应 locale，界面文案即时切换

### Requirement: 模块自包含 validator
每个业务模块 SHALL 在自身 `validator.ts` 中定义 Zod schema，不得通过 `shared/validate.ts` re-export `../../validators/*`。

## MODIFIED Requirements
### Requirement: 中间件类型安全
`authMiddleware/adminMiddleware/publicModeMiddleware` SHALL 类型化为 `MiddlewareHandler<AppContext>`，`getAuthUser` 参数为 `Context<AppContext>`；所有路由 SHALL 使用 `c.var.validatedBody` 而非 `c.get('validatedBody')`；`AppContext.Variables` SHALL 包含可选 `authUser` 与 `validatedBody`。

### Requirement: 模块注册表精简
`ModuleRegistry` SHALL 仅保留 `register()` 与 `install()`，移除未被调用的 `get()`/`list()`。

## REMOVED Requirements
### Requirement: 旧目录架构
**Reason**: 模块化迁移收尾，旧 `src/{routes,middleware,services,utils,validators,models}/` 与 `frontend/src/api/` 为死代码或被新模块反向依赖的遗留物，违反 AGENTS.md §1「不留旧代码」。
**Migration**: 共享类型迁入 `shared/types.ts`，`isValidUrl` 迁入 `shared/favicon.ts`，schema 迁入各模块 `validator.ts`，`ServiceFactory` 由直接实例化替代，其余直接删除。

### Requirement: useLanguage hook
**Reason**: `useLanguage()` 定义后无任何组件调用，语言切换同步逻辑应内聚到 `app` store。
**Migration**: `setLanguage` action 内联 i18n 同步；删除 hook 文件。

### Requirement: 前端 @types/node 依赖
**Reason**: `tsconfig` types 仅 `["vite/client"]`，源码无 Node 模块导入，未使用。
**Migration**: 从 `devDependencies` 移除。

### Requirement: 未使用 UI 组件
**Reason**: `checkbox/tabs/textarea` 三个 shadcn-vue 组件目录业务零引用。
**Migration**: 直接删除目录。
