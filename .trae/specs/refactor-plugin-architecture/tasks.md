# Tasks

## 阶段一：清理与基础设施

- [ ] Task 1: 移除图片代理与注册功能，清理冗余代码
  - [ ] SubTask 1.1: 删除 `src/routes/proxy.ts` 及其在 `src/index.ts` 中的引用
  - [ ] SubTask 1.2: 从 `src/routes/auth.ts` 移除 `/register` 路由处理函数
  - [ ] SubTask 1.3: 移除前端注册相关代码（`frontend/src/views/login/` 中注册入口、`frontend/src/api/auth.ts` 中 register 方法）
  - [ ] SubTask 1.4: 清理 `src/utils/favicon.ts` 中远程抓取逻辑，如保留 favicon 功能改为前端直连公开服务
  - [ ] SubTask 1.5: 全局搜索并移除对上述功能的引用（导入、类型、文档）

- [ ] Task 2: 升级根目录与前端 package.json 依赖到 Node 24 兼容最新版
  - [ ] SubTask 2.1: 更新根 `package.json`：Hono ^4.7、Zod ^3.24、@cloudflare/workers-types ^4.20250605、wrangler ^4、TypeScript ^5.8、@types/node ^24、ESLint ^10
  - [ ] SubTask 2.2: 更新 `frontend/package.json`：Vue ^3.5、Vite ^6、@vitejs/plugin-vue ^5、Pinia ^3、vue-router ^4.5、vue-i18n ^11、TypeScript ^5.8、vue-tsc ^2.2、@types/node ^24
  - [ ] SubTask 2.3: 新增前端依赖：tailwindcss ^4、@tailwindcss/vite ^4、reka-ui ^2、class-variance-authority ^0.7、clsx ^2、tailwind-merge ^2、lucide-vue-next
  - [ ] SubTask 2.4: 移除前端依赖：naive-ui、unplugin-vue-components、dompurify、tailwindcss ^3、autoprefixer、postcss（Tailwind 4 不需要）
  - [ ] SubTask 2.5: 运行 `pnpm install` 验证依赖树，修复 peer dependency 冲突

## 阶段二：后端模块化重构

- [ ] Task 3: 搭建模块注册表基础设施
  - [ ] SubTask 3.1: 创建 `src/modules/types.ts`，定义 `AppContext`（Bindings + Variables）、`ModuleDefinition` 接口（name、mountPath、router、middlewares）
  - [ ] SubTask 3.2: 创建 `src/modules/registry.ts`，实现 `ModuleRegistry` 类（register、install、get、list 方法，重复注册抛错）
  - [ ] SubTask 3.3: 创建 `src/modules/shared/` 目录，存放共享工具（response、errors、logger、db helper、jwt、password、validate），从 `src/utils/` 迁移
  - [ ] SubTask 3.4: 重写 `src/index.ts`：初始化 Hono App、注册全局中间件、创建 ModuleRegistry、注册所有模块、SPA 回退

- [ ] Task 4: 重构 auth 模块（移除注册）
  - [ ] SubTask 4.1: 创建 `src/modules/auth/` 目录，包含 `index.ts`、`routes.ts`、`service.ts`、`validator.ts`、`types.ts`
  - [ ] SubTask 4.2: 迁移 `/login` 路由逻辑，移除 `/register` 路由
  - [ ] SubTask 4.3: 迁移 UserService 中登录相关方法到 `auth/service.ts`
  - [ ] SubTask 4.4: 迁移 Zod 校验 schema（仅保留 loginSchema，移除 registerSchema）

- [ ] Task 5: 重构 init 模块（首次管理员创建）
  - [ ] SubTask 5.1: 创建 `src/modules/init/` 目录
  - [ ] SubTask 5.2: 实现 `/init` 接口：检查管理员是否存在，不存在则读取 `INITIAL_ADMIN_USERNAME` + `INITIAL_ADMIN_PASSWORD` 创建
  - [ ] SubTask 5.3: 未配置环境变量时生成随机密码，创建管理员，`console.log` 输出凭据一次
  - [ ] SubTask 5.4: 移除 `schema.sql` 中 `INSERT INTO users` 默认管理员数据

- [ ] Task 6: 重构 panel 模块（图标 + 分组）
  - [ ] SubTask 6.1: 创建 `src/modules/panel/` 目录，子模块 `item-icon/` 与 `group/`
  - [ ] SubTask 6.2: 迁移 `/panel/itemIcon/*` 路由到 `panel/item-icon/routes.ts`
  - [ ] SubTask 6.3: 迁移 `/panel/itemIconGroup/*` 路由到 `panel/group/routes.ts`
  - [ ] SubTask 6.4: 迁移 `/panel/getAllData` 路由到 `panel/routes.ts`（聚合入口）
  - [ ] SubTask 6.5: 迁移 PanelService 到 `panel/service.ts`，拆分图标与分组服务

- [ ] Task 7: 重构 user-config 模块
  - [ ] SubTask 7.1: 创建 `src/modules/user-config/` 目录
  - [ ] SubTask 7.2: 迁移 `/panel/userConfig/*` 路由
  - [ ] SubTask 7.3: 迁移用户配置 CRUD 逻辑

- [ ] Task 8: 重构 users 管理模块（管理员）
  - [ ] SubTask 8.1: 创建 `src/modules/users/` 目录
  - [ ] SubTask 8.2: 迁移 `/panel/users/*` 路由（getList、create、update、deletes、getPublicVisitUser、setPublicVisitUser）
  - [ ] SubTask 8.3: 迁移 `/user/*` 路由（getAuthInfo、updateInfo、updatePassword）
  - [ ] SubTask 8.4: 迁移 UserService 中用户管理方法到 `users/service.ts`

- [ ] Task 9: 重构 settings 模块
  - [ ] SubTask 9.1: 创建 `src/modules/settings/` 目录
  - [ ] SubTask 9.2: 迁移 `/system/*` 与 `/about` 路由
  - [ ] SubTask 9.3: 迁移 SettingsService 到 `settings/service.ts`

- [ ] Task 10: 重构中间件为模块化挂载
  - [ ] SubTask 10.1: 迁移 `src/middleware/` 到 `src/modules/shared/middleware/`（auth、cors、csrf、securityHeaders、bodyLimit、rateLimiter）
  - [ ] SubTask 10.2: 全局中间件（cors、csrf、securityHeaders、bodyLimit）在 `src/index.ts` 全局挂载
  - [ ] SubTask 10.3: 模块级中间件（auth、rateLimiter）通过 ModuleDefinition.middlewares 挂载到对应模块

- [ ] Task 11: 移除硬编码变量
  - [ ] SubTask 11.1: 移除 `src/utils/jwt.ts` 中 JWT_SECRET 默认值，未配置时抛错
  - [ ] SubTask 11.2: 更新 `src/utils/env.ts` 校验逻辑，`JWT_SECRET` 为必填
  - [ ] SubTask 11.3: 检查所有源码文件，确认无硬编码密钥、密码、ID

## 阶段三：前端 shadcn-vue 迁移

- [ ] Task 12: 配置 Tailwind CSS 4 + shadcn-vue 基础设施
  - [ ] SubTask 12.1: 删除 `frontend/tailwind.config.js`、`frontend/postcss.config.js`
  - [ ] SubTask 12.2: 创建 `frontend/src/styles/main.css`，使用 `@import "tailwindcss"` + `@theme` 指令定义设计令牌
  - [ ] SubTask 12.3: 创建 `frontend/src/styles/theme.css`，定义浅色/深色 CSS 变量（--background、--foreground、--primary 等）
  - [ ] SubTask 12.4: 更新 `frontend/vite.config.ts`：移除 unplugin-vue-components、添加 @tailwindcss/vite 插件
  - [ ] SubTask 12.5: 创建 `frontend/src/lib/utils.ts`，实现 `cn()` helper（clsx + tailwind-merge）
  - [ ] SubTask 12.6: 创建 `frontend/components.json`（shadcn-vue 配置）

- [ ] Task 13: 生成 shadcn-vue 基础组件
  - [ ] SubTask 13.1: 生成 Button 组件到 `frontend/src/components/ui/button/`
  - [ ] SubTask 13.2: 生成 Input 组件到 `frontend/src/components/ui/input/`
  - [ ] SubTask 13.3: 生成 Dialog 组件到 `frontend/src/components/ui/dialog/`
  - [ ] SubTask 13.4: 生成 Form 组件到 `frontend/src/components/ui/form/`（基于 reka-ui）
  - [ ] SubTask 13.5: 生成 Select 组件到 `frontend/src/components/ui/select/`
  - [ ] SubTask 13.6: 生成 Table 组件到 `frontend/src/components/ui/table/`
  - [ ] SubTask 13.7: 生成 DropdownMenu 组件到 `frontend/src/components/ui/dropdown-menu/`
  - [ ] SubTask 13.8: 生成 Card、Tabs、Switch、Toast 等其余必要组件

- [ ] Task 14: 重构前端模块化结构
  - [ ] SubTask 14.1: 创建 `frontend/src/modules/` 目录，按功能拆分：auth、panel、users、settings
  - [ ] SubTask 14.2: 每个模块包含 `api.ts`（API 调用）、`composable.ts`（业务逻辑）、`types.ts`（类型）
  - [ ] SubTask 14.3: 迁移 `frontend/src/api/` 到各模块的 `api.ts`
  - [ ] SubTask 14.4: 迁移 `frontend/src/views/home/composables/` 到 `modules/panel/composable.ts`

- [ ] Task 15: 迁移登录页
  - [ ] SubTask 15.1: 重写 `frontend/src/views/login/index.vue` 使用 shadcn-vue 组件
  - [ ] SubTask 15.2: 重写 `frontend/src/views/login/composables/useLoginPage.ts`
  - [ ] SubTask 15.3: 移除注册表单与相关逻辑

- [ ] Task 16: 迁移主页与设置面板
  - [ ] SubTask 16.1: 重写 `frontend/src/views/home/index.vue` 及子组件（HomeSidebar、HomeItemCard、HomeLogo、HomeWallpaper 等）
  - [ ] SubTask 16.2: 重写 `panels/` 下所有组件使用 shadcn-vue（PanelAnnounceSettings、PanelGroupManage、PanelImportExport、PanelSiteSettings、PanelStyleSettings、PanelUserInfo）
  - [ ] SubTask 16.3: 重写模态框（HomeEditIconModal、HomeIframeModal）使用 shadcn Dialog
  - [ ] SubTask 16.4: 迁移 composables（useAnnouncement、useConfigEditor、useDataLoader、useFavicon、useItemEditor、useSiteConfig、useWallpaper）

- [ ] Task 17: 迁移用户管理与 404 页
  - [ ] SubTask 17.1: 重写 `frontend/src/components/apps/Users/index.vue` 与 `EditUser/index.vue` 使用 shadcn Table + Form + Dialog
  - [ ] SubTask 17.2: 重写 `frontend/src/views/exception/404/index.vue`

- [ ] Task 18: 重构主题与国际化 hooks
  - [ ] SubTask 18.1: 重写 `frontend/src/hooks/useTheme.ts`，基于 CSS 变量切换（添加/移除 `dark` class 到 `<html>`）
  - [ ] SubTask 18.2: 保留并验证 `frontend/src/hooks/useLanguage.ts`（vue-i18n 11 兼容）
  - [ ] SubTask 18.3: 重写 `frontend/src/store/modules/app.ts` 主题逻辑

- [ ] Task 19: 重构 HTTP 请求层
  - [ ] SubTask 19.1: 保留 `frontend/src/utils/request/axios.ts`，移除 `requestCache.ts`（如非必要）
  - [ ] SubTask 19.2: 更新请求拦截器，移除对 Naive UI message 的依赖，改用 shadcn-vue toast
  - [ ] SubTask 19.3: 移除 `frontend/src/utils/faviconUtils.ts` 中代理相关逻辑

## 阶段四：配置与 CI/CD

- [ ] Task 20: 更新构建配置
  - [ ] SubTask 20.1: 更新 `frontend/vite.config.ts`：Tailwind 4 插件、移除 manualChunks 中 naive-ui、更新 chunk 策略
  - [ ] SubTask 20.2: 更新 `frontend/tsconfig.json`：paths 别名 `@/*`、严格模式
  - [ ] SubTask 20.3: 更新根 `tsconfig.json`：Node 24 类型、模块解析策略
  - [ ] SubTask 20.4: 更新 `eslint.config.js`：移除 vue-eslint-parser 与 naive-ui 相关规则，添加 shadcn-vue 友好规则
  - [ ] SubTask 20.5: 更新 `wrangler.toml`：保持 `__D1_DATABASE_ID__` 占位符、添加 `[vars]` 非敏感变量说明（如有）

- [ ] Task 21: 更新 GitHub Actions 工作流
  - [ ] SubTask 21.1: 更新 `.github/workflows/deploy-worker.yml`：Node 24、pnpm 最新版、最新 actions/checkout@v6、actions/setup-node@v6、cloudflare/wrangler-action@latest
  - [ ] SubTask 21.2: 在部署步骤后增加 Cloudflare Secrets 检查说明（JWT_SECRET、INITIAL_ADMIN_USERNAME、INITIAL_ADMIN_PASSWORD 需通过 wrangler secret 预先配置）
  - [ ] SubTask 21.3: 更新 `.github/workflows/pr-check.yml`：增加 `pnpm run typecheck`（vue-tsc）步骤
  - [ ] SubTask 21.4: 确认所有 Secret 名称不以 `GITHUB_` 开头（CF_API_TOKEN、CF_ACCOUNT_ID、CF_D1_DATABASE_ID）

## 阶段五：文档建设

- [ ] Task 22: 编写 CLAUDE.md
  - [ ] SubTask 22.1: 项目概述与定位（Cloudflare Workers 导航面板）
  - [ ] SubTask 22.2: 技术栈版本清单（后端 Hono + D1，前端 Vue 3 + shadcn-vue + Tailwind 4）
  - [ ] SubTask 22.3: 目录结构说明（src/modules/ 模块化、frontend/src/modules/ + components/ui/）
  - [ ] SubTask 22.4: 模块注册表架构说明（如何新增模块）
  - [ ] SubTask 22.5: 常用命令（pnpm dev、pnpm build、pnpm deploy、pnpm lint、pnpm db:init）
  - [ ] SubTask 22.6: 代码风格约定（Conventional Commits、ESLint + Prettier、无内联样式）
  - [ ] SubTask 22.7: 禁区清单（不得硬编码变量、不得添加图片代理、不得添加注册接口、不得使用 Naive UI）
  - [ ] SubTask 22.8: 测试与验证流程

- [ ] Task 23: 编写 AGENTS.md
  - [ ] SubTask 23.1: AI Agent 协作总则（先读 spec、遵守模块边界、不跨层修改）
  - [ ] SubTask 23.2: 模块边界规则（后端模块自包含、前端模块自包含、UI 组件仅样式）
  - [ ] SubTask 23.3: 提交信息规范（Conventional Commits：feat/fix/refactor/docs/chore）
  - [ ] SubTask 23.4: PR 检查清单（lint、typecheck、build 通过）
  - [ ] SubTask 23.5: 依赖管理规则（仅升级到 Node 24 兼容版本、不引入新 UI 库）
  - [ ] SubTask 23.6: 安全实践（变量外置、无 SSRF、无公开注册）

- [ ] Task 24: 更新 README.md
  - [ ] SubTask 24.1: 更新技术栈版本表
  - [ ] SubTask 24.2: 更新目录结构图（反映 src/modules/ 与 frontend/src/components/ui/）
  - [ ] SubTask 24.3: 更新密钥配置流程（移除默认账号说明，增加 INITIAL_ADMIN_* 配置）
  - [ ] SubTask 24.4: 移除图片代理与注册相关 API 文档
  - [ ] SubTask 24.5: 更新环境变量说明表

## 阶段六：验证

- [ ] Task 25: 全量验证
  - [ ] SubTask 25.1: `pnpm lint` 通过（根 + frontend）
  - [ ] SubTask 25.2: `pnpm run typecheck` 通过（vue-tsc + tsc）
  - [ ] SubTask 25.3: `pnpm run build` 前端构建成功
  - [ ] SubTask 25.4: `wrangler deploy --dry-run` 预检通过
  - [ ] SubTask 25.5: 全局搜索确认无 `naive-ui`、`proxy-image`、`register`、`admin123`、硬编码 JWT_SECRET 残留
  - [ ] SubTask 25.6: 确认所有模块在 `src/index.ts` 中正确注册
  - [ ] SubTask 25.7: 确认 `schema.sql` 无默认管理员 INSERT

# Task Dependencies

- Task 2 依赖 Task 1（清理后再升级依赖避免冲突）
- Task 3 依赖 Task 2（基础设施先就绪）
- Task 4-9 依赖 Task 3（模块注册表先搭建）
- Task 4-9 之间可并行（各模块独立）
- Task 10 依赖 Task 4-9（中间件挂载依赖模块定义）
- Task 11 依赖 Task 4-9（变量清理在模块重构后）
- Task 12 依赖 Task 2（前端依赖先升级）
- Task 13 依赖 Task 12（基础组件先就绪）
- Task 14 依赖 Task 13（模块化结构基于组件）
- Task 15-17 依赖 Task 14（页面迁移基于模块结构）
- Task 15-17 之间可并行
- Task 18-19 依赖 Task 15-17
- Task 20 依赖 Task 11 + Task 19（配置更新在代码重构后）
- Task 21 依赖 Task 20
- Task 22-24 依赖 Task 21（文档在功能定型后）
- Task 25 依赖 Task 22-24（最终验证）
