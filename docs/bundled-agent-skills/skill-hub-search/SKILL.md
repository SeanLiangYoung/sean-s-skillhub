---
name: skill-hub-search
description: 在 Skill Hub 技能市场中使用聚合搜索、理解多市场结果与打开详情（ClawHub 兼容 API）。
---

# Skill Hub · 技能搜索

## 何时使用

用户在本机 Skill Hub Web UI 的「技能市场 → 聚合搜索」中，需要跨多个 ClawHub 兼容市场查找 Skill，或需要说明 `registry`、限流、镜像与环境变量时。

## 标准流程（应用内）

1. 打开 Skill Hub，进入 **技能市场**，确认在 **聚合搜索** 标签。
2. 在搜索框输入关键词或简短需求描述（底层仍为各注册表关键词检索）。
3. 在侧栏勾选要检索的 **HTTP 应用市场**（`kind: clawhub-http`）。
4. 点击 **搜索**。结果由服务端 `POST /api/marketplace/search` 合并，按 `score` 降序；同一 `slug` 在不同 registry 可能多行（分开展示）。
5. 每条结果可 **打开** 对应市场的 Web 详情页（`webBase/skills/{slug}`），请使用卡片上的来源标签确认市场。

## 部分源失败

若返回中带有 `errors`，仅表示部分 registry 不可用，其余结果仍有效。遇 429 可减少并发搜索或配置 `SKILL_HUB_CLAWHUB_TOKEN`（见应用内说明）。

## 与「安装」的边界

本 Skill 止于 **找到候选并明确 slug + registry**。落盘 ZIP 或安装到 Claude/Cursor 见 `skill-hub-install`。
