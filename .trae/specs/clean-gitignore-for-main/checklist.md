# Checklist

## .gitignore 规则
- [ ] `.gitignore` 包含 `.trae/` 忽略条目
- [ ] `.gitignore` 已覆盖 node_modules/、dist/、.cache/、*.tmp、.wrangler/ 等构建产物/依赖/缓存/临时文件

## Git 跟踪清理
- [ ] `git ls-files | grep .trae` 无输出（.trae 文件不再被跟踪）
- [ ] 本地 `.trae/` 目录及文件仍然存在（未删除本地文件）

## 锁定文件保留
- [ ] `pnpm-lock.yaml` 仍被 git 跟踪
- [ ] `package-lock.json` 仍被 git 跟踪
- [ ] `frontend/package-lock.json` 仍被 git 跟踪

## 提交验证
- [ ] 提交内容仅包含 `.gitignore` 修改与 `.trae/` 文件移除
- [ ] 无运行时代码被修改
