# Checklist

## 阶段一：清理与基础设施

- [ ] 图片代理接口 `/api/proxy-image`（GET + POST）已完全移除，`src/routes/proxy.ts` 文件已删除
- [ ] 用户注册接口 `/register` 已移除，前端注册表单与 API 调用已删除
- [ ] `src/utils/favicon.ts` 中远程抓取逻辑已移除或改为前端直连公开服务
- [ ] 所有对已移除功能的引用（导入、类型、文档）已清理干净
- [ ] 根 `package.json` 依赖已升级到 Node 24 兼容最新版（Hono ^4.7、wrangler ^4、TypeScript ^5.8、@types/node ^24）
- [ ] 前端 `package.json` 依赖已升级（Vue ^3.5、Vite ^6、Pinia ^3、vue-i18n ^11、vue-tsc ^2.2）
- [ ] 前端新增 shadcn-vue 生态依赖（tailwindcss ^4、@tailwindcss/vite ^4、reka-ui ^2、class-variance-authority、clsx、tailwind-merge、lucide-vue-next）
- [ ] 前端移除 naive-ui、unplugin-vue-components、dompurify、tailwindcss ^3、autoprefixer、postcss
- [ ] `pnpm install` 成功，无 peer dependency 冲突

## 阶段二：后端模块化重构

- [ ] `src/modules/types.ts` 已创建，定义 `AppContext`、`ModuleDefinition` 接口
- [ ] `src/modules/registry.ts` 已创建，实现 `ModuleRegistry` 类（register、install、get、list）
- [ ] `src/modules/shared/` 已创建，共享工具（response、errors、logger、db、jwt、password、validate）已迁移
- [ ] `src/index.ts` 已重写，使用 ModuleRegistry 注册所有模块
- [ ] auth 模块（`src/modules/auth/`）已创建，仅包含 `/login` 路由，无 `/register`
- [ ] init 模块（`src/modules/init/`）已创建，`/init` 接口仅返回初始化状态与面板数据
- [ ] `schema.sql` 默认管理员凭据已更新为 `admin` / `admin`（SHA-256 哈希 `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`）
- [ ] panel 模块（`src/modules/panel/`）已创建，包含 item-icon、group 子模块与 getAllData 聚合入口
- [ ] user-config 模块（`src/modules/user-config/`）已创建
- [ ] users 模块（`src/modules/users/`）已创建，包含 `/panel/users/*` 与 `/user/*` 路由
- [ ] settings 模块（`src/modules/settings/`）已创建，包含 `/system/*` 与 `/about` 路由
- [ ] 中间件已迁移到 `src/modules/shared/middleware/`，全局中间件在 index.ts 挂载，模块级中间件通过 ModuleDefinition.middlewares 挂载
- [ ] 每个模块目录自包含 `index.ts`、`routes.ts`、`service.ts`、`validator.ts`、`types.ts`
- [ ] 模块间无内部实现依赖，仅通过共享类型通信
- [ ] `JWT_SECRET` 硬编码默认值已移除，未配置时启动失败并提示
- [ ] 源码中无硬编码 JWT_SECRET、CF_API_TOKEN、CF_ACCOUNT_ID、CF_D1_DATABASE_ID（默认管理员 admin/admin 保留在 schema.sql）

## 阶段三：前端 shadcn-vue 迁移

- [ ] `frontend/tailwind.config.js` 与 `frontend/postcss.config.js` 已删除
- [ ] `frontend/src/styles/main.css` 已创建，使用 `@import "tailwindcss"` + `@theme` 指令
- [ ] `frontend/src/styles/theme.css` 已创建，定义浅色/深色 CSS 变量
- [ ] `frontend/vite.config.ts` 已更新，添加 @tailwindcss/vite 插件，移除 unplugin-vue-components
- [ ] `frontend/src/lib/utils.ts` 已创建，实现 `cn()` helper
- [ ] `frontend/components.json` 已创建（shadcn-vue 配置）
- [ ] shadcn-vue 基础组件已生成（button、input、dialog、form、select、table、dropdown-menu、card、tabs、switch、toast 等）
- [ ] `frontend/src/modules/` 已创建，按功能拆分（auth、panel、users、settings）
- [ ] 每个前端模块包含 `api.ts`、`composable.ts`、`types.ts`
- [ ] 登录页已迁移到 shadcn-vue，无注册表单
- [ ] 主页及所有 panels 组件已迁移到 shadcn-vue
- [ ] 模态框已迁移到 shadcn Dialog
- [ ] 用户管理组件已迁移到 shadcn Table + Form + Dialog
- [ ] 404 页已迁移
- [ ] `useTheme.ts` 已重写为基于 CSS 变量切换（dark class）
- [ ] HTTP 请求层已更新，移除 Naive UI message 依赖，改用 shadcn-vue toast
- [ ] 全局搜索确认无 `naive-ui` 导入残留
- [ ] 全局搜索确认无 `NMessage`、`NDialog` 等 Naive UI 组件残留

## 阶段四：配置与 CI/CD

- [ ] `frontend/vite.config.ts` chunk 策略已更新，无 naive-ui chunk
- [ ] `frontend/tsconfig.json` paths 别名 `@/*` 已配置
- [ ] 根 `tsconfig.json` Node 24 类型已配置
- [ ] `eslint.config.js` 已更新，移除 naive-ui 相关规则
- [ ] `wrangler.toml` 保持 `__D1_DATABASE_ID__` 占位符，无真实 ID
- [ ] `.github/workflows/deploy-worker.yml` 使用 Node 24、pnpm 最新版、最新 actions 版本
- [ ] `.github/workflows/pr-check.yml` 增加 `pnpm run typecheck` 步骤
- [ ] 所有 GitHub Secret 名称不以 `GITHUB_` 开头（CF_API_TOKEN、CF_ACCOUNT_ID、CF_D1_DATABASE_ID）
- [ ] 文档说明 Cloudflare Secrets 配置要求（JWT_SECRET 必填）

## 阶段五：文档建设

- [ ] `CLAUDE.md` 已创建，包含项目概述、技术栈版本、目录结构、模块架构、常用命令、代码风格、禁区清单、测试要求
- [ ] `AGENTS.md` 已创建，包含协作总则、模块边界规则、提交规范、PR 检查清单、依赖管理、安全实践
- [ ] `README.md` 已更新：技术栈版本表、目录结构图、密钥配置流程、API 文档（移除图片代理与注册）、环境变量说明

## 阶段六：验证

- [ ] `pnpm lint` 通过（根 + frontend）
- [ ] `pnpm run typecheck` 通过（vue-tsc + tsc）
- [ ] `pnpm run build` 前端构建成功
- [ ] `wrangler deploy --dry-run` 预检通过
- [ ] 全局搜索无 `naive-ui` 残留
- [ ] 全局搜索无 `proxy-image` 残留
- [ ] 全局搜索无 `/register` 路由残留
- [ ] 全局搜索无 `admin123` 硬编码残留（默认管理员已改为 admin/admin）
- [ ] 全局搜索无硬编码 `JWT_SECRET` 默认值
- [ ] 所有后端模块在 `src/index.ts` 中正确注册
- [ ] `schema.sql` 默认管理员为 admin/admin（非原 admin@sun.com/admin123）
- [ ] 无内联样式（inline style）违反约定
