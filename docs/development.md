# 开发与调试

## 前置要求

- Node.js **≥ 20**（见根目录 `package.json` 的 `engines`）

## 安装依赖

在仓库根目录执行：

```bash
npm install
```

## 开发模式

同时启动后端（默认 `3456`）与前端开发服务器（`5173`），后者将 `/api` 与 `/ws` 代理到本机后端：

```bash
npm run dev
```

也可分别运行：

```bash
npm run dev:server   # tsx watch server/index.ts
npm run dev:web      # vite，root 为 web/
```

## 生产构建与启动

```bash
npm run build   # vite build + tsc 编译 server
npm start       # node dist/server/index.js
```

若未先构建前端，`server` 会以 **仅 API 模式** 启动并在控制台提示缺少 `dist/web`（仍可通过 `/api/*` 访问）。

## 环境变量

| 变量 | 作用 |
|------|------|
| `PORT` | HTTP 起始端口（默认 `3456`；占用时自动尝试后续端口） |
| `SKILL_HUB_NO_OPEN` | 设为 `1` 时启动不自动打开浏览器 |
| `SKILL_HUB_EXTRA_PATHS` | 额外扫描路径，冒号或逗号分隔 |
| `SKILL_HUB_CLAWHUB_TOKEN` | ClawHub 请求令牌（可选，可能缓解限流） |
| `SKILL_HUB_CLAWHUB_TRY_SKILLS_LIST` | 设为 `1` 时优先请求 ClawHub `/api/v1/skills`（见服务端 clawhub 路由注释） |
| `SKILL_HUB_MARKETPLACE_PRESETS_JSON` | 自定义市场预设 JSON（解析失败时会在日志中提示） |

更完整的扫描路径说明见根目录 [README](../README.md) 中的「扫描覆盖的位置」。

## 排错

1. **列表数量不对或白屏**  
   打开 `http://localhost:<端口>/api/debug`（若端口被顺延，以控制台输出为准），保存返回的 JSON 便于定位扫描路径与耗时。

2. **ClawHub 429 / 限流**  
   减少连续搜索/安装间隔；可配置 `SKILL_HUB_CLAWHUB_TOKEN`。服务端在部分错误响应中会返回可读提示。

3. **Skillhub.cn 安装失败**  
   确认本机已按 `/api/skillhub-cn/status` 返回中的说明安装 `skillhub` CLI，且可在终端执行 `skillhub --version`。

## TypeScript 与路径别名

- 根 `tsconfig.json`：`@/*` → `web/src/*`（与 Vite `resolve.alias` 一致）。
- `@server/*` 已映射到 `server/*`，可按需在工具脚本或测试中引用；当前应用代码以相对路径为主。

## 代码布局提示

- 新增 HTTP 能力：在 `server/routes/` 增加或扩展路由模块，并在 `server/index.ts` 中 `register`。
- 扫描逻辑变更：优先修改 `server/scanner/`，并注意与 `invalidateCache()`、watcher 的交互。
