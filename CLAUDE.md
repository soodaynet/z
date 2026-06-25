# CLAUDE.md — Cloudflare-Sun-Panel 项目工作指引

> 本文档面向未来在本仓库工作的 Claude AI 助手。请先通读全文再动手，严格遵守「禁区清单」与「模块注册表架构」两节。

---

## 1. 项目概述

Cloudflare-Sun-Panel 是一个基于 **Cloudflare Workers + D1 + Vue 3** 的个人导航面板应用。后端采用 Hono 框架与插件式模块化架构，前端基于 Vue 3 + shadcn-vue 现代化 UI。整体定位于「一键部署到 Cloudflare、零服务器运维的私有导航面板」：用户登录后可管理图标分组、自定义面板样式与搜索引擎，管理员可管理系统设置与用户。项目已完成插件式模块化架构重构与 shadcn-vue 前端现代化迁移。

---

## 2. 技术栈版本清单

### 后端（根 `package.json`）
| 依赖 | 版本 |
| --- | --- |
| hono | ^4.7.8 |
| zod | ^3.24.0 |
| @cloudflare/workers-types | ^4.20250605.0 |
| wrangler | ^4.0.0 |
| typescript | ^5.9.0 |
| @types/node | ^24.0.0 |
| eslint | ^10.4.1 |
| @eslint/js | ^10.0.1 |
| typescript-eslint | ^8.60.1 |
| eslint-plugin-vue | ^10.9.2 |
| vue-eslint-parser | ^10.4.1 |
| globals | ^17.6.0 |
| Node 运行时 | 24 |

### 前端（`frontend/package.json`）
| 依赖 | 版本 |
| --- | --- |
| vue | ^3.5.13 |
| vite | ^6.0.6 |
| @vitejs/plugin-vue | ^5.2.1 |
| tailwindcss | ^4.0.0 |
| @tailwindcss/vite | ^4.0.0 |
| reka-ui | ^2.0.0 |
| shadcn-vue | 生成式组件（见 `components.json`，style=new-york, baseColor=neutral, iconLibrary=lucide） |
| class-variance-authority | ^0.7.0 |
| clsx | ^2.1.1 |
| tailwind-merge | ^2.5.0 |
| lucide-vue-next | ^0.460.0 |
| pinia | ^3.0.0 |
| vue-router | ^4.5.0 |
| vue-i18n | ^11.0.0 |
| typescript | ^5.8.0 |
| vue-tsc | ^2.2.0 |
| tw-animate-css | ^1.0.0 |
| axios | ^1.7.9 |
| vue-draggable-plus | ^0.6.0 |

### 数据库与认证
- **数据库**：Cloudflare D1（SQLite 兼容），binding 名 `DB`，库名 `sun-panel-db`
- **认证**：JWT HMAC-SHA256，基于 Web Crypto API 实现（`src/modules/shared/jwt.ts`），Token 有效期 7 天
- **包管理**：pnpm ^10.15.1，workspace monorepo（根 + `frontend/`，见 `pnpm-workspace.yaml`）
- **CI/CD**：GitHub Actions（`.github/workflows/deploy-worker.yml` + `pr-check.yml`）

---

## 3. 目录结构

```
/workspace
├── src/                                # 后端 Cloudflare Worker
│   ├── index.ts                        # Hono App 入口：全局中间件 + 模块注册表 + SPA 回退
│   ├── modules/                        # 插件式模块化架构
│   │   ├── types.ts                    # AppContext、AppBindings、ModuleDefinition 接口
│   │   ├── registry.ts                 # ModuleRegistry 类（register/install/get/list）
│   │   ├── shared/                     # 共享工具与中间件（模块间唯一通信通道）
│   │   │   ├── jwt.ts                  # JWT 签名/验证（Web Crypto API）
│   │   │   ├── env.ts                  # 环境变量校验（JWT_SECRET 必填）
│   │   │   ├── response.ts、errors.ts、logger.ts
│   │   │   ├── db.ts、password.ts、validate.ts、origin.ts
│   │   │   └── middleware/             # cors、csrf、securityHeaders、bodyLimit、auth、rateLimiter
│   │   ├── auth/                       # 登录模块（无注册）
│   │   ├── init/                       # 初始化状态接口
│   │   ├── panel/                      # 面板模块（item-icon、group 子模块 + getAllData 聚合）
│   │   ├── user-config/                # 用户配置
│   │   ├── users/                      # 用户管理（usersAdminModule + userSelfModule）
│   │   └── settings/                   # 系统设置
│   │   （每个模块自包含：index.ts/routes.ts/service.ts/validator.ts/types.ts）
│   ├── schema.sql                      # D1 表结构 + 默认管理员 admin/admin
│   └── （旧 routes/、services/、utils/、middleware/、validators/ 已废弃，仅为向后兼容保留）
├── frontend/                           # Vue 3 前端
│   ├── package.json、vite.config.ts、tsconfig.json、components.json
│   ├── src/
│   │   ├── main.ts、App.vue、env.d.ts
│   │   ├── components/ui/              # shadcn-vue 生成组件（禁止修改源码）
│   │   │   └── button/input/card/dialog/form/select/table/dropdown-menu/tabs/switch/checkbox/textarea/badge/sonner/label
│   │   ├── modules/                    # 业务模块（auth/panel/users/settings，每个含 api.ts + types.ts）
│   │   ├── views/
│   │   │   ├── login/                  # 登录页（含 composables/useLoginPage.ts）
│   │   │   ├── home/                   # 主页（index.vue + components/ + composables/ + components/panels/）
│   │   │   └── exception/404/
│   │   ├── components/apps/Users/      # 用户管理（index.vue + EditUser/）
│   │   ├── hooks/useTheme.ts、useLanguage.ts
│   │   ├── store/modules/              # Pinia store（app、auth、panel）
│   │   ├── locales/                    # i18n（zh-CN、en-US）
│   │   ├── router/、lib/utils.ts（cn helper）
│   │   ├── styles/main.css（Tailwind 4 @theme 指令）、global.css
│   │   ├── utils/request/（axios.ts + index.ts）、faviconUtils.ts、importExport.ts、requestCache.ts、storageKeys.ts
│   │   └── （旧 api/ 目录已废弃，仅为向后兼容保留）
├── .github/workflows/
│   ├── deploy-worker.yml               # 推送 main 自动部署（typecheck + build + wrangler deploy + db init）
│   └── pr-check.yml                    # PR 检查（typecheck + build + lint）
├── eslint.config.js、tsconfig.json、wrangler.toml、pnpm-workspace.yaml、schema.sql
└── CLAUDE.md、AGENTS.md、README.md
```

---

## 4. 模块注册表架构说明

### 核心约定

后端采用**插件式模块化架构**，所有业务逻辑以模块形式注册到全局 `ModuleRegistry`。

- **模块目录**：每个模块位于 `src/modules/<name>/`，自包含 5 个文件：
  - `index.ts` — 导出 `ModuleDefinition` 对象（`name` / `mountPath` / `router` / `middlewares?`）
  - `routes.ts` — 定义该模块的 Hono 路由
  - `service.ts` — 业务逻辑（数据库操作、聚合查询等）
  - `validator.ts` — Zod 请求体/参数校验
  - `types.ts` — 模块内部类型定义
- **注册流程**：在 `src/index.ts` 中 `registry.register(module)` 注册，最后 `registry.install(app)` 一次性挂载。
- **挂载机制**：`registry.install(app)` 会先挂载模块级 `middlewares`（仅作用于 `mountPath/*`），再 `app.route(mountPath, router)` 挂载路由。
- **模块间通信**：模块**不得**引用彼此内部实现，仅通过 `shared/` 共享工具与 `types.ts` 共享类型通信。
- **中间件分层**：
  - 全局中间件在 `src/index.ts` 顶部 `app.use('*', ...)` 挂载（cors / csrf / securityHeaders / bodyLimit）
  - 模块级中间件（如 `auth`）通过 `ModuleDefinition.middlewares` 挂载

### 新增后端模块步骤

1. 创建 `src/modules/<name>/`，实现 `index.ts` / `routes.ts` / `service.ts` / `validator.ts` / `types.ts`
2. 在 `index.ts` 中导出符合 `ModuleDefinition` 接口的对象：
   ```ts
   export const fooModule: ModuleDefinition = {
     name: 'foo',
     mountPath: '/api/foo',
     router,
     middlewares: [authMiddleware], // 可选
   }
   ```
3. 在 `src/index.ts` 中 `import { fooModule } from './modules/foo'` 并 `registry.register(fooModule)`
4. 校验逻辑放 `validator.ts`，业务逻辑放 `service.ts`，路由层只做参数解析、调用 service、统一响应

### 关键接口（`src/modules/types.ts`）

```ts
export interface AppBindings {
  DB: D1Database
  ASSETS: Fetcher
  JWT_SECRET: string
}

export interface AppContext {
  Bindings: AppBindings
  Variables: { userId?: number; username?: string; role?: number; isPublicMode?: boolean }
}

export interface ModuleDefinition {
  name: string
  mountPath: string
  router: Hono<AppContext>
  middlewares?: MiddlewareHandler<AppContext>[]
}
```

---

## 5. 前端 shadcn-vue 约定

### UI 组件使用
- 组件位于 `frontend/src/components/ui/<name>/`，每个目录有 `index.ts` 统一导出
- 导入方式：`import { Button } from '@/components/ui/button'`
- `components.json` 配置：`style=new-york`、`baseColor=neutral`、`cssVariables=true`、`iconLibrary=lucide`、`tsConfigPath=./tsconfig.json`、Tailwind CSS 指向 `src/styles/main.css`
- **禁止修改** `frontend/src/components/ui/**` 下的组件源码——这些是 shadcn-vue 生成代码

### 新增 UI 组件
```bash
npx shadcn-vue add <name>
```
或手动创建目录并遵循 `components.json` 的别名约定（`@/components/ui`）。

### 业务模块
- 位于 `frontend/src/modules/<name>/`，包含 `api.ts`（API 调用）+ `types.ts`（类型），统一从 `@/modules` 导入
- 已有模块：`auth` / `panel` / `users` / `settings`

### Toast 与对话框
- Toast 替代 Naive UI `useMessage`：
  ```ts
  import { toast } from '@/components/ui/sonner'
  toast.success('保存成功')
  toast.error('保存失败')
  ```
- 对话框使用 shadcn `Dialog`，禁止使用 naive-ui 的 `useDialog`

### 主题
- 通过 CSS 变量 + `<html>` 上的 `dark` class 切换（见 `frontend/src/hooks/useTheme.ts`），不再依赖 store 驱动样式
- 支持 `light` / `dark` / `auto`（auto 跟随系统 `prefers-color-scheme`）
- Tailwind 4 使用 CSS-first 配置（`@theme` 指令），**无 `tailwind.config.js`**

### 样式约束
- **禁止内联样式** `style="..."`；动态样式用 `:style="{ '--var': value }"` 绑定 CSS 变量

---

## 6. 常用命令

```bash
# 安装依赖
pnpm install

# 本地开发（同时启动 Worker 与前端）
pnpm dev                    # wrangler dev（端口 8787）
pnpm --filter frontend dev  # Vite dev（端口 3000，代理 /api 到 8787）

# 类型检查
pnpm run typecheck                    # 后端 tsc --noEmit
pnpm --filter frontend run typecheck  # 前端 vue-tsc --noEmit

# Lint 与格式化
pnpm run lint
pnpm run format
pnpm run format:check

# 构建前端
pnpm --filter frontend run build      # 含 vue-tsc 类型检查
pnpm --filter frontend run build:fast # 仅 vite build，跳过类型检查

# 数据库
pnpm run db:init         # 远程 D1 执行 schema.sql
pnpm run db:init:local   # 本地 D1 执行 schema.sql

# 部署
pnpm run deploy      # wrangler deploy
pnpm run deploy:dry  # wrangler deploy --dry-run（预检）

# 配置 Cloudflare Secret
wrangler secret put JWT_SECRET    # 必填，未配置则 Worker 启动失败
```

---

## 7. 密钥与变量管理

### Cloudflare Workers Secrets
| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `JWT_SECRET` | ✅ 必填 | JWT 签名密钥，通过 `wrangler secret put JWT_SECRET` 配置；未配置时 `validateEnv` 抛错，Worker 启动失败并提示 `JWT_SECRET is required` |

### GitHub Actions Secrets（命名**不得**以 `GITHUB_` 开头）
| 名称 | 用途 |
| --- | --- |
| `CF_API_TOKEN` | Cloudflare API Token（Workers 编辑权限） |
| `CF_ACCOUNT_ID` | Cloudflare Account ID |
| `CF_D1_DATABASE_ID` | D1 数据库 ID，CI 通过 `sed` 注入到 `wrangler.toml` |

### wrangler.toml 中的占位符
- `database_id = "__D1_DATABASE_ID__"` 保持占位符，**不要**在仓库中写入真实 ID；CI 在部署时通过 `sed -i "s/__D1_DATABASE_ID__/${{ secrets.CF_D1_DATABASE_ID }}/g" wrangler.toml` 注入

### 禁止
- 不得硬编码任何密钥、密码、ID 到源码

---

## 8. 默认管理员说明

- `schema.sql` 在 `users` 表为空时插入默认管理员：
  - 用户名：`admin`
  - 密码：`admin`（SHA-256：`8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`）
  - 角色：`1`（管理员），状态：`1`（启用）
- **首次登录后建议立即修改密码**。
- 系统为私有面板，**无注册接口**，用户由管理员后台创建。

---

## 9. 代码风格约定

- **TypeScript 严格模式**：`"strict": true`
- **Vue 单文件组件**：使用 `<script setup lang="ts">` 语法
- **类型导入**：`import type { ... }`
- **Conventional Commits**：`feat` / `fix` / `refactor` / `docs` / `chore` / `test` / `perf`
- **Lint 与格式化**：ESLint + Prettier（`.prettierrc`）
- **注释**：中文注释保留，标识符用英文
- **响应格式**：后端统一 `{ code: number, msg: string, data: T | null }`，`code: 0` 表示成功

---

## 10. 禁区清单

> 以下行为**严格禁止**，违反将破坏架构或引入安全风险。

- ❌ 不得硬编码 `JWT_SECRET`、`CF_API_TOKEN`、`CF_ACCOUNT_ID`、`CF_D1_DATABASE_ID` 到源码
- ❌ 不得添加图片代理接口（`/api/proxy-image`）——存在 SSRF 风险，已移除
- ❌ 不得添加用户注册接口（`/register`）——私有面板场景，用户由管理员后台创建
- ❌ 不得引入 Naive UI 或任何 `N` 前缀组件——已迁移到 shadcn-vue
- ❌ 不得引入 `dompurify`——已移除，`footerHtml` 改用纯文本插值
- ❌ 不得使用内联样式（`style="..."`）——动态样式用 `:style` 绑定 CSS 变量
- ❌ 不得使用 naive-ui 的 `useMessage` / `useDialog`——改用 `@/components/ui/sonner` 的 `toast` 或 shadcn `Dialog`
- ❌ 不得跨模块引用其他模块的内部实现——只通过 `shared/` 与共享类型通信
- ❌ 不得修改 `frontend/src/components/ui/**` 下的 shadcn-vue 组件源码——这些是生成代码
- ❌ 不得在 GitHub Secret 名称中使用 `GITHUB_` 前缀
- ❌ 不得在 `wrangler.toml` 中写入真实 `database_id`——保持 `__D1_DATABASE_ID__` 占位符

---

## 11. 测试与验证流程

### CI 工作流
- **PR 检查**（`.github/workflows/pr-check.yml`）：触发于 PR 到 `main`，自动运行：
  1. 后端 typecheck（`pnpm run typecheck`）
  2. 前端 typecheck（`pnpm run typecheck`，working-directory=`./frontend`）
  3. 前端 build（`pnpm run build`，working-directory=`./frontend`）
  4. Lint（`pnpm run lint`）
- **部署**（`.github/workflows/deploy-worker.yml`）：触发于推送 `main`（`paths-ignore: **.md`），自动：
  1. 后端 + 前端 typecheck
  2. 前端 build
  3. `sed` 注入 D1 database_id
  4. `wrangler deploy`（部署 Worker + 静态前端）
  5. `wrangler d1 execute --remote --file=./schema.sql`（D1 初始化，`continue-on-error: true`）

### 本地验证（提交前必跑）
```bash
pnpm run typecheck && pnpm run lint && pnpm --filter frontend run build && pnpm run deploy:dry
```

### 部署后验证
- 访问 `/api/health`，预期返回：
  ```json
  { "code": 0, "msg": "ok", "data": { "status": "running", "time": "<ISO8601>" } }
  ```
- 默认管理员登录验证：用户名 `admin`，密码 `admin`

---

## 12. 常见任务示例

### 示例 A：新增一个后端 API 模块（以 `bookmark` 为例）

1. 创建 `src/modules/bookmark/`，包含 5 文件：
   - `types.ts`：定义 DTO 与 Zod schema 类型
   - `validator.ts`：`export const createBookmarkSchema = z.object({ ... })`
   - `service.ts`：`export async function listBookmarks(db: D1Database, userId: number) { ... }`
   - `routes.ts`：
     ```ts
     import { Hono } from 'hono'
     import type { AppContext } from '../types'
     import { authMiddleware } from '../shared/middleware/auth'
     import { listBookmarks } from './service'

     const router = new Hono<AppContext>()
     router.get('/', authMiddleware, async (c) => {
       const data = await listBookmarks(c.env.DB, c.get('userId')!)
       return c.json({ code: 0, msg: 'ok', data })
     })
     export { router }
     ```
   - `index.ts`：
     ```ts
     import type { ModuleDefinition } from '../types'
     import { router } from './routes'
     import { authMiddleware } from '../shared/middleware/auth'

     export const bookmarkModule: ModuleDefinition = {
       name: 'bookmark',
       mountPath: '/api/bookmark',
       router,
       middlewares: [authMiddleware],
     }
     ```
2. 在 `src/index.ts` 中：
   ```ts
   import { bookmarkModule } from './modules/bookmark'
   registry.register(bookmarkModule)
   ```
3. 跑 `pnpm run typecheck && pnpm run lint`，提交时用 `feat(api): add bookmark module`

### 示例 B：新增一个前端页面（以 `/about` 为例）

1. 在 `frontend/src/views/about/index.vue` 创建页面组件（`<script setup lang="ts">`）
2. 在 `frontend/src/router/` 注册路由
3. 业务 API 放 `frontend/src/modules/<name>/api.ts`，类型放 `types.ts`
4. UI 组件从 `@/components/ui/*` 引入；Toast 用 `@/components/ui/sonner` 的 `toast`
5. 文案走 i18n：在 `frontend/src/locales/zh-CN.ts` 与 `en-US.ts` 补充 key
6. 验证：`pnpm --filter frontend run typecheck && pnpm --filter frontend run build`

---

## 参考文档
- `README.md` — 项目说明
- `AGENTS.md` — 子代理协作指引
- `wrangler.toml` — Cloudflare Workers 配置（含密钥与路由说明注释）
- `schema.sql` — D1 数据库表结构
- `.github/workflows/` — CI/CD 工作流
