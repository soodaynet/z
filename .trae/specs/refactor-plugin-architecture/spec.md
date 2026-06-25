# 插件式模块化架构重构 + 技术栈现代化 Spec

## Why

当前项目（Cloudflare-Sun-Panel）存在以下问题，阻碍后续演进：

1. **架构耦合**：后端路由、服务、校验逻辑分散在 `routes/`、`services/`、`validators/` 三层目录中，功能边界模糊，新增功能需跨多目录修改，无法独立扩展。
2. **技术债**：Tailwind CSS 3.x 配置方式陈旧；Naive UI 与 Tailwind 样式体系割裂；部分依赖未升级到 Node 24 原生支持版本。
3. **安全隐患**：图片代理接口（`/api/proxy-image`）存在 SSRF 风险；用户注册接口（`/register`）允许公开注册，不适合私有导航面板场景；JWT 密钥存在硬编码默认值；默认管理员密码硬编码在 `schema.sql`。
4. **变量硬编码**：`JWT_SECRET`、默认管理员账号密码等敏感信息散落在代码中，未通过 Cloudflare Secrets 或 GitHub Actions Secrets 管理。
5. **缺少 AI 协作指引**：项目无 `CLAUDE.md`、`AGENTS.md`，未来 AI 助手难以快速理解项目约定。

本次重构通过插件式模块注册表架构、shadcn-vue + Tailwind 4 前端现代化、敏感变量外置、AI 协作文档建设，建立可维护、可扩展、安全的基础。

## What Changes

### 架构变更
- **BREAKING**：后端引入模块注册表（Module Registry）模式，每个功能模块自包含路由 + 服务 + 校验器 + 类型，通过统一注册表挂载到 Hono App。
- **BREAKING**：前端迁移 Naive UI → shadcn-vue + Reka UI，统一基于 Tailwind CSS 4 的设计系统。
- **BREAKING**：Tailwind CSS 从 3.x 升级到 4.x，采用 CSS-first 配置（`@theme` 指令替代 `tailwind.config.js`）。

### 功能移除
- **BREAKING**：移除图片代理接口 `/api/proxy-image`（GET + POST）及其全部相关代码。
- **BREAKING**：移除用户注册接口 `/register`，用户仅由管理员在后台创建。
- 移除 `src/routes/proxy.ts`、`src/utils/favicon.ts` 中远程抓取逻辑（如保留 favicon 功能则改为前端直连公开服务）。
- 移除前端 `frontend/src/api/` 中与上述功能相关的调用。
- 移除冗余文件、未使用导出、死代码。

### 技术栈升级（全部升级到原生支持 Node 24 的最新稳定版）
- **后端**：Hono ^4.7、Zod ^3.24（或 ^4 如已稳定）、@cloudflare/workers-types ^4.20250605、wrangler ^4、TypeScript ^5.8、@types/node ^24。
- **前端**：Vue ^3.5、Vite ^6（或 ^7 如已稳定）、@vitejs/plugin-vue ^5、Tailwind CSS ^4、@tailwindcss/vite ^4、Reka UI ^2、class-variance-authority ^0.7、clsx ^2、tailwind-merge ^2、lucide-vue-next（图标）、Pinia ^3、vue-router ^4.5、vue-i18n ^11、TypeScript ^5.8、vue-tsc ^2.2。
- 移除 `naive-ui`、`unplugin-vue-components`（shadcn-vue 组件直接 import，无需自动导入解析器）、`dompurify`（如 shadcn-vue 内置或不再需要）。
- 移除 `vue-draggable-plus`（如 shadcn-vue 生态有替代，或保留最新版）。

### 变量与密钥外置
- **BREAKING**：移除 `JWT_SECRET` 硬编码默认值，改为必填 Cloudflare Secret，未配置时启动失败并提示。
- **BREAKING**：移除 `schema.sql` 中硬编码的默认管理员账号密码，改为首次运行时通过 `/init` 接口读取 `INITIAL_ADMIN_USERNAME` + `INITIAL_ADMIN_PASSWORD` 环境变量创建（如未设置则生成随机密码并写入系统日志一次）。
- **BREAKING**：`wrangler.toml` 中 `database_id` 占位符 `__D1_DATABASE_ID__` 保持，由 GitHub Actions 注入；不在代码仓库中提交真实 ID。
- 所有敏感变量通过 GitHub Actions Secrets（命名不以 `GITHUB_` 开头）或 Cloudflare Workers Secrets 管理。

### 文档建设
- 新增 `CLAUDE.md`：面向 Claude AI 助手的项目工作指引（架构、约定、命令、禁区）。
- 新增 `AGENTS.md`：面向通用 AI Agent 的协作规范（模块边界、代码风格、测试要求、提交规范）。
- 更新 `README.md`：反映新架构、新依赖、新密钥配置流程。

### CI/CD 优化
- 更新 `.github/workflows/deploy-worker.yml`：使用 Node 24、最新 actions 版本、pnpm 最新版。
- 更新 `.github/workflows/pr-check.yml`：增加类型检查、构建验证。
- 文档化所有 GitHub Actions Secrets 与 Cloudflare Secrets 的对应关系。

## Impact

- **Affected specs**：认证（移除注册）、面板管理（移除图片代理）、用户管理（仅管理员创建）、系统设置、初始化流程。
- **Affected code**：
  - `src/` 全部重构为 `src/modules/` 模块化结构
  - `frontend/src/` 全部重构（组件库迁移 + 模块化）
  - `wrangler.toml`、`schema.sql`、`package.json`（根 + frontend）
  - `.github/workflows/`、`eslint.config.js`、`tsconfig.json`、`vite.config.ts`
  - 新增 `CLAUDE.md`、`AGENTS.md`
- **Affected data**：`schema.sql` 不再插入默认管理员，需通过初始化接口或迁移脚本创建首管理员。
- **Affected deployment**：部署前必须配置 Cloudflare Secrets（`JWT_SECRET`、`INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_PASSWORD`），否则 Worker 启动失败。

## ADDED Requirements

### Requirement: 模块注册表架构

系统 SHALL 提供统一的模块注册表（`ModuleRegistry`），所有业务功能以独立模块形式注册。

#### Scenario: 模块注册与挂载
- **WHEN** 开发者创建新功能模块（包含 `name`、`mountPath`、`router`、可选 `middlewares`）
- **AND** 通过 `registry.register(module)` 注册
- **AND** 调用 `registry.install(app)` 挂载
- **THEN** 模块路由在指定 `mountPath` 下可访问
- **AND** 模块中间件仅作用于该 `mountPath` 下的路由

#### Scenario: 模块隔离
- **WHEN** 模块 A 与模块 B 均已注册
- **THEN** 模块 A 的服务、校验器、类型不引用模块 B 的内部实现
- **AND** 模块间仅通过明确定义的接口（如共享类型）通信

#### Scenario: 模块自包含
- **WHEN** 查看任意模块目录
- **THEN** 该目录包含 `index.ts`（注册入口）、`routes.ts`（路由）、`service.ts`（业务逻辑）、`validator.ts`（Zod 校验）、`types.ts`（类型定义）
- **AND** 不依赖其他模块的内部文件

### Requirement: shadcn-vue 组件系统

系统 SHALL 使用 shadcn-vue + Reka UI 作为前端组件库，统一基于 Tailwind CSS 4 设计系统。

#### Scenario: 组件复用
- **WHEN** 开发者需要按钮、对话框、表单等基础组件
- **THEN** 从 `frontend/src/components/ui/` 导入预生成的 shadcn-vue 组件
- **AND** 组件样式通过 Tailwind 4 工具类 + CSS 变量定义
- **AND** 不再使用 Naive UI 组件

#### Scenario: 主题切换
- **WHEN** 用户切换浅色/深色主题
- **THEN** 通过 CSS 变量（`--background`、`--foreground` 等）驱动 shadcn-vue 组件配色
- **AND** 主题配置定义在 `frontend/src/styles/theme.css` 中

### Requirement: 敏感变量外置

系统 SHALL 通过 Cloudflare Workers Secrets 或 GitHub Actions Secrets 管理所有敏感变量，代码中不得硬编码任何密钥、密码、ID。

#### Scenario: JWT 密钥
- **WHEN** Worker 启动且 `JWT_SECRET` 未配置
- **THEN** 启动失败并返回明确错误："JWT_SECRET is required. Set it via `wrangler secret put JWT_SECRET`."
- **AND** 不存在任何默认回退值

#### Scenario: 初始管理员创建
- **WHEN** 首次部署后调用 `/init` 接口且数据库无管理员
- **AND** 配置了 `INITIAL_ADMIN_USERNAME` 与 `INITIAL_ADMIN_PASSWORD`
- **THEN** 创建初始管理员账号
- **WHEN** 未配置上述变量
- **THEN** 系统生成随机密码，创建管理员，将凭据写入 Workers 日志一次（`console.log`）

### Requirement: CLAUDE.md 与 AGENTS.md 文档

系统 SHALL 提供完整的 AI 协作指引文档。

#### Scenario: CLAUDE.md 内容
- **WHEN** AI 助手阅读 `CLAUDE.md`
- **THEN** 文档包含：项目概述、技术栈版本、目录结构、模块架构说明、常用命令（dev/build/deploy/lint）、代码风格约定、禁区（不得硬编码变量、不得添加图片代理、不得添加注册接口）、测试要求

#### Scenario: AGENTS.md 内容
- **WHEN** AI 助手阅读 `AGENTS.md`
- **THEN** 文档包含：模块边界规则、提交信息规范（Conventional Commits）、PR 检查清单、依赖管理规则、安全实践

### Requirement: GitHub Actions 自动部署

系统 SHALL 通过 GitHub Actions 自动部署到 Cloudflare Workers，所有敏感配置通过 Secrets 管理。

#### Scenario: 推送触发部署
- **WHEN** 推送代码到 `main` 分支（非 `.md` 文件变更）
- **THEN** GitHub Actions 自动构建前端、部署 Worker、初始化 D1
- **AND** 所有敏感值从 GitHub Secrets 读取（`CF_API_TOKEN`、`CF_ACCOUNT_ID`、`CF_D1_DATABASE_ID`）
- **AND** Secret 名称不以 `GITHUB_` 开头

## MODIFIED Requirements

### Requirement: 用户认证

用户认证 SHALL 仅支持登录（`/login`），不再支持公开注册。用户账号由管理员在后台通过 `/panel/users/create` 创建。

#### Scenario: 用户登录
- **WHEN** 用户提交用户名 + 密码到 `/login`
- **AND** 凭据正确
- **THEN** 返回 JWT token（7 天有效期）
- **AND** 不存在 `/register` 接口

#### Scenario: 用户创建
- **WHEN** 管理员调用 `/panel/users/create`
- **AND** 提交新用户信息
- **THEN** 创建新用户
- **AND** 普通用户无法访问此接口

### Requirement: 面板管理

面板管理 SHALL 提供分组与图标的 CRUD，不再提供图片代理功能。

#### Scenario: 图片代理移除
- **WHEN** 请求 `/api/proxy-image`（GET 或 POST）
- **THEN** 返回 404
- **AND** 代码中不存在 `src/routes/proxy.ts` 或相关引用

### Requirement: 系统初始化

系统初始化 SHALL 通过 `/init` 接口完成首次管理员创建，凭据来自环境变量。

#### Scenario: 首次初始化
- **WHEN** 数据库无管理员且配置了 `INITIAL_ADMIN_USERNAME` + `INITIAL_ADMIN_PASSWORD`
- **THEN** 创建初始管理员
- **AND** `schema.sql` 不再包含 `INSERT INTO users` 默认数据

## REMOVED Requirements

### Requirement: 图片代理接口

**Reason**：存在 SSRF 安全风险，且非导航面板核心功能。
**Migration**：如需外部图片展示，前端直接使用目标 URL 或通过公开 favicon 服务（如 `https://www.google.com/s2/favicons?domain=`）。

### Requirement: 用户注册接口

**Reason**：私有导航面板场景无需公开注册，管理员后台创建用户更安全。
**Migration**：现有注册用户数据保留，新用户通过管理员后台创建。移除 `/register` 路由与前端注册入口。

### Requirement: 硬编码默认凭据

**Reason**：硬编码密码（`admin123`）与 JWT 默认密钥是安全隐患。
**Migration**：部署后通过 Cloudflare Secrets 配置 `JWT_SECRET`、`INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_PASSWORD`，由 `/init` 接口完成首次管理员创建。
