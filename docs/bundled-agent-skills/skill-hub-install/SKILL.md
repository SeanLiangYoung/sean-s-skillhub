---
name: skill-hub-install
description: 从 Skill Hub 下载 Skill ZIP 或安装到 Claude/Cursor 技能目录，含可疑包与 force 说明。
---

# Skill Hub · 技能安装

## 前提

需要明确的 **slug** 与 **registry**（通常来自聚合搜索或单市场搜索）。若用户只有自然语言需求，先完成市场搜索。

## 标准流程（应用内）

1. 在技能市场结果卡片上：
  - **下载**：调用 `GET /api/clawhub/download?slug=&registry=`（可选 `force=1` 绕过可疑标记），浏览器保存 ZIP，不写入 `~/.claude/skills` 或 `~/.cursor/skills`。
  - **Claude / Cursor**：`POST /api/clawhub/install`，body 含 `slug`、`registry`、`target`（`claude-code` 或 `cursor`）、必要时 `force: true`。
2. 恶意包会被拒绝；可疑包需用户确认后再 `force`（与下载策略一致）。
3. 安装成功后可在应用内 **一键扫描** 刷新本机技能列表。

## 安装路径

- Claude Code：`~/.claude/skills/<slug>/`
- Cursor：`~/.cursor/skills/<slug>/`

与仓库内 `docs/bundled-agent-skills/` 说明文档无关，勿与用户本机安装目录混淆。
