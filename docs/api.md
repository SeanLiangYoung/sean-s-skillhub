# HTTP API 概览

以下为本项目暴露的主要 REST 端点，供集成或排错时参考。除特别说明外，响应体多为 JSON。生产环境建议仅在本机或受信网络使用。

## 健康与诊断

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 服务存活检查，返回 `{ status: 'ok' }` |
| GET | `/api/debug` | 环境、扫描耗时、各路径命中数等诊断信息（报 bug 时很有用） |

## 扫描与技能列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/scan` | 触发全量扫描并更新缓存，返回完整扫描结果 |
| GET | `/api/skills` | 列出技能；查询参数可选：`scope`、`source`、`agent`、`search` |
| GET | `/api/skills/:id` | 单个技能详情 |
| GET | `/api/agents` | 支持的 Agent 列表（供筛选 UI） |
| GET | `/api/projects` | 已发现的项目列表 |
| GET | `/api/conflicts` | 同名冲突信息 |
| GET | `/api/stats` | 聚合统计 |

## 编辑与管理

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/api/skills/:id/toggle` | Body: `enabled`, `skillName` — 启用/禁用（写 `settings.json`） |
| PUT | `/api/skills/:id/content` | Body: `realPath`, `content` — 保存 `SKILL.md` |
| POST | `/api/skills/copy` | 复制到全局或项目目录 |
| POST | `/api/skills/move` | 移动（复制后删源） |
| DELETE | `/api/skills/:id` | Body: `path`, 可选 `skillName` — 移入回收站 |
| POST | `/api/skills/batch/delete` | Body: `items[]` — 批量移入回收站 |

## 版本历史

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/versions/snapshot` | Body: `skillPath`, `skillName`, `message` — 手动快照 |
| GET | `/api/versions/history` | Query: `skillPath` |
| GET | `/api/versions/detail` | Query: `skillPath`, `versionId` |
| GET | `/api/versions/diff` | Query: `skillPath`, `oldId`, `newId` |
| GET | `/api/versions/diff-current` | Query: `skillPath`, `versionId` |
| POST | `/api/versions/rollback` | Body: `skillPath`, `versionId` |
| DELETE | `/api/versions` | Query: `skillPath`, `versionId` |

## 相似技能

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/similar` | Query: 可选 `threshold`（默认约 0.25） |
| POST | `/api/similar/ignore` | Body: `a`, `b`（技能 id）— 忽略一对 |
| POST | `/api/similar/unignore` | Body: `a`, `b` |
| GET | `/api/similar/ignored` | 已忽略的配对列表 |

## 回收站

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/trash` | 列表（拉取时会顺带清理过期项） |
| POST | `/api/trash/:id/restore` | Query: 可选 `force` — 还原 |
| DELETE | `/api/trash/:id` | 永久删除一条 |
| POST | `/api/trash/purge-expired` | 手动清理过期项 |

## 市场与外部源

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/marketplace/providers` | 合并后的市场提供方配置 |

### ClawHub（代理与安装）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/clawhub/search` | Query: `q`, 可选 `limit`, `registry` |
| GET | `/api/clawhub/skills` | 浏览列表；可选 `limit`, `sort`, `cursor`, `registry` 等 |
| GET | `/api/clawhub/skill/:slug` | 单个 skill 元数据 |
| POST | `/api/clawhub/install` | Body: `slug`, 可选 `version`, `force`, `target`, `registry` |

限流、令牌等见 [开发与调试](./development.md) 中的环境变量说明。

### Skillhub.cn（本机 CLI）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skillhub-cn/status` | 是否检测到 `skillhub` CLI |
| GET | `/api/skillhub-cn/search` | Query: `q` |
| POST | `/api/skillhub-cn/install` | Body: `name`, 可选 `target` |

## WebSocket

| 路径 | 说明 |
|------|------|
| `/ws` | 订阅文件变更广播；消息为 JSON 字符串 |
