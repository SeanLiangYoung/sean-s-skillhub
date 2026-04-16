# 架构概览

Skill Hub 是运行在用户本机上的 **Fastify 后端 + React 前端** 应用：浏览器访问 `http://127.0.0.1:<端口>`，API 与静态资源由同一进程提供（生产模式），开发模式下前端由 Vite 独立服务并代理 API。

## 仓库目录

| 路径 | 职责 |
|------|------|
| `server/` | Fastify 应用、路由、扫描器、版本与回收站存储、ClawHub / Skillhub.cn 等集成；`app.ts` 导出 `buildApp()`（供进程入口与 Vitest `inject` 测试复用） |
| `server/routes/` | 按领域划分的 HTTP 路由（skills、manage、versions、similarity、trash、clawhub、skillhub-cn、marketplace） |
| `server/scanner/` | 全盘发现各 Agent 技能路径（含 `~/.claude/plugins`、`~/.cursor/plugins` 下 `skills/`、条件 OpenClaw 根 `skills/` 等）、解析、相似度、文件监听（chokidar） |
| `server/versioning/` | Skill 内容快照与历史 |
| `server/trash/` | 软删除与回收站元数据 |
| `server/clawhub/` | ClawHub API 客户端与 zip 解压安装 |
| `server/marketplace/` | 市场源预设与 HTTP 注册表解析 |
| `web/` | Vite 根目录；`web/src` 为 React 源码（组件、hooks） |
| `bin/` | `skill-hub` / `claude-skill-hub` CLI：启动编译后的 `dist/server/index.js` |

## 构建与产物

- **前端**：`vite build` 将产物输出到仓库根目录下的 `dist/web/`（见 `vite.config.ts` 中的 `build.outDir`）。
- **后端**：`tsc -p tsconfig.server.json` 将 `server/` 编译到 `dist/server/`，运行时使用 `.js` 扩展名的 ESM 导入。
- **全局命令**：`npm install -g` 后，`bin/cli.js` 要求已存在 `dist/server/index.js`；发布前需执行 `npm run build`。

生产模式下，服务器在多个候选路径中查找 **同时包含 `index.html` 与 `assets/`** 的目录，避免误把未构建的 `web/` 当作静态根目录导致白屏。

## 运行时行为

- **监听地址**：默认 `127.0.0.1`，仅本机访问。
- **端口**：环境变量 `PORT` 为起始端口（默认 `3456`）；若被占用会依次尝试后续端口（最多若干次）。
- **扫描缓存**：技能列表等数据在内存中缓存；文件变更经 watcher 防抖后调用 `invalidateCache()` 并可通过 WebSocket 通知前端刷新。
- **启动时**：会尝试执行一次全量扫描以便控制台展示统计；回收站会异步清理过期项。

## WebSocket

- 路径：`/ws`。文件系统变更经防抖后向已连接客户端广播 JSON 消息（类型包含 `change` 等），用于驱动 UI 自动刷新。

## 与本机 Claude 的交互

- **启用/禁用**：通过读写用户目录下 `~/.claude/settings.json` 中的 `permissions.deny` 规则实现。
- **编辑**：直接读写各 Skill 目录内的 `SKILL.md`；保存前后可触发版本快照（见 `manage` 与 `versioning` 路由）。
