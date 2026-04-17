---
name: skill-hub-library
description: Skill Hub 本机技能库扫描、列表、冲突与回收站（与市场拉包分离）。
---

# Skill Hub · 本机技能库

## 覆盖范围

- **一键扫描**与 WebSocket 变更提示，扫描路径由服务端 [`server/scanner`](../../../server/scanner) 与各 Agent 约定目录决定。
- **列表与筛选**：按层级、来源、Agent、项目等（以当前 Web UI 为准）。
- **冲突**：同名技能多路径时的处理与删除进回收站。
- **回收站**：恢复或永久删除（与 Trash API 一致）。

## 与市场搜索的边界

本 Skill **不**描述如何从 ClawHub 注册表搜索 slug；市场侧见 `skill-hub-search` / `skill-hub-install`。

## 与相似检测

相似度分析见 `skill-hub-similarity`；建议先扫描再查看相似结果（依赖当前索引）。
