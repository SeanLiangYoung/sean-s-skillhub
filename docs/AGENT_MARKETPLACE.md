# 智能体扩展技能市场（可选）

Skill Hub 默认在应用内通过 **ClawHub 兼容 HTTP API**（含讯飞 SkillHub、ClawHub 中国镜像等）搜索并 ZIP 安装 skill，**无需**配置 LLM。

对于没有公开 REST API 的门户或云控制台，可使用 **智能体发现** 页：

1. 编辑「市场 URL」列表（保存在本机浏览器）。
2. 填写关键词。
3. 点击 **复制到剪贴板**，将提示词粘贴到 **Cursor** 或 **Claude Code** 对话中。
4. 由已配置的 LLM 与浏览器工具访问页面并归纳结果；若你拿到 skill 包或目录，可放入 `~/.claude/skills` 或 `~/.cursor/skills`，再用 Skill Hub **一键扫描**。

运维人员可通过环境变量 **`SKILL_HUB_MARKETPLACE_PRESETS_JSON`** 增加自定义 ClawHub 兼容端点（仅 `https`，服务端会做 SSRF 校验）。示例：

```json
[
  {
    "id": "my-team",
    "label": "团队镜像",
    "kind": "clawhub-http",
    "baseUrl": "https://registry.example.com"
  }
]

```

自定义条目的 `id` 不能与内置 id（`clawhub`、`skillhub`、`clawhub_cn`、`skillhubcn`、`link-catalog`、`agent-guided`）冲突。
