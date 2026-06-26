# 清理 Git 跟踪：仅推送源代码与必要配置 Spec

## Why

当前 `.trae/` 目录下的 6 个 spec 文件被 git 跟踪并已提交至 `origin/main`。这些文件属于 AI 协作工作区内容，不应进入主分支。此外 `.gitignore` 中缺少对 `.trae/` 的忽略规则，导致后续 spec 文件会被持续跟踪。本变更确保推送到 main 分支的内容仅包含源代码与必要的配置文件。

## What Changes

- 将 `.trae/` 重新加入 `.gitignore` 忽略规则
- 从 git 跟踪中移除已提交的 `.trae/` 文件（`git rm --cached`，保留本地文件）
- 保留 lock 文件（`pnpm-lock.yaml`、`package-lock.json`、`frontend/package-lock.json`）的跟踪，因为它们是可复现构建的必要配置

## Impact

- Affected code: `.gitignore`、git 索引（移除 `.trae/` 跟踪）
- 不影响任何运行时代码或构建流程
- 后续 `.trae/specs/` 下的 spec 文件不再被 git 跟踪

## ADDED Requirements

### Requirement: .trae 目录忽略
`.gitignore` SHALL 包含 `.trae/` 忽略规则，确保 TRAE 工作区内容不被推送至远程仓库。

#### Scenario: 新建 spec 文件
- **WHEN** 在 `.trae/specs/` 下创建新的 spec 文件
- **THEN** git status 不显示该文件为未跟踪

### Requirement: 清理已跟踪的 .trae 文件
已提交至 git 的 `.trae/` 文件 SHALL 从 git 索引中移除，同时保留本地工作区文件。

#### Scenario: 执行清理后
- **WHEN** 运行 `git ls-files | grep .trae`
- **THEN** 无任何输出

## REMOVED Requirements

### Requirement: .trae 目录纳入版本控制
**Reason**: `.trae/` 属于 AI 协作工作区内容，不应推送至 main 分支
**Migration**: 使用 `git rm --cached -r .trae/` 移除跟踪，文件保留在本地
