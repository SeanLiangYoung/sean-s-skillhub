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

## 前端 URL 与顶栏视图

单页应用可通过查询参数 **`view`** 打开指定顶栏页，便于书签、分享与自动化测试直达某一屏。该机制**仅由浏览器端维护**，不增加新的 REST 路径；与 [`server/app.ts`](../server/app.ts) 中「未知路径回退 `index.html`」配合，刷新或打开带查询参数的链接不会 404。

### 参数约定

| 项目 | 说明 |
|------|------|
| 参数名 | `view` |
| 合法取值 | `skills`、`similar`、`dashboard`、`trash`、`conflicts`、`marketplace`（与 `web/src/types/appView.ts` 中 `AppView` 一致） |
| 缺省 | 无 `view` 或为空时，界面等价于 **`skills`** |
| 非法值 | 仍按 **skills** 展示，并将地址栏 **`replaceState`** 为 `?view=skills`（避免残留无效书签） |
| 其它查询参数 | 写入 `view` 时保留已有参数（仅覆盖或追加 `view`） |

示例（端口以控制台为准，占位符 `<端口>`）：

- 生产或 `npm start`：`http://127.0.0.1:<端口>/?view=trash`
- 开发 `npm run dev`：前端在 **5173**，后端在 **3456**，浏览器通常打开 Vite 地址，例如 `http://127.0.0.1:5173/?view=marketplace`（同样生效）

### 实现位置（维护时查阅）

| 路径 | 作用 |
|------|------|
| `web/src/utils/appViewUrl.ts` | 解析 / 校验 `view`；单元测试见 `web/src/utils/appViewUrl.test.ts` |
| `web/src/hooks/useSyncedAppView.ts` | `view` 状态与 `history.pushState` / `popstate` 同步 |
| `web/src/App.tsx` | 使用 `useSyncedAppView()` 取得 `view` 与 `setView` |

顶栏切换会 **`pushState`**，浏览器**后退 / 前进**会恢复之前的 `view` 与地址栏。

## 生产构建与启动

```bash
npm run build   # vite build + tsc 编译 server
npm start       # node dist/server/index.js
```

## E2E（Playwright）

冒烟测试在 `e2e/`。首次在本机运行前需安装浏览器二进制：

```bash
npx playwright install chromium
```

然后先构建再跑（`playwright.config` 会启动 `dist/server/index.js`）：

```bash
npm run build
npm run test:e2e
```

若未先构建前端，`server` 会以 **仅 API 模式** 启动并在控制台提示缺少 `dist/web`（仍可通过 `/api/*` 访问）。

## 环境变量

| 变量 | 作用 |
|------|------|
| `PORT` | HTTP 起始端口（默认 `3456`；占用时自动尝试后续端口） |
| `SKILL_HUB_NO_OPEN` | 设为 `1` 时启动不自动打开浏览器 |
| `SKILL_HUB_DISABLE_WATCH` | 设为 `1` 时不启动文件监听（适合 CI、沙箱或 `EMFILE` 环境；列表仍可通过「一键扫描」刷新） |
| `SKILL_HUB_EXTRA_PATHS` | 额外扫描路径，冒号或逗号分隔 |
| `SKILL_HUB_CLAWHUB_TOKEN` | ClawHub 请求令牌（可选，可能缓解限流） |
| `SKILL_HUB_CLAWHUB_TRY_SKILLS_LIST` | 设为 `1` 时优先请求 ClawHub `/api/v1/skills`（见服务端 clawhub 路由注释） |
| `SKILL_HUB_CLAWHUB_REGISTRY` | 覆盖默认 ClawHub 根地址（默认 `https://clawhub.ai`），须为与 ClawHub 同形状的 API |

更完整的扫描路径说明见根目录 [README](../README.md) 中的「扫描覆盖的位置」。

## 排错

1. **列表数量不对或白屏**  
   打开 `http://localhost:<端口>/api/debug`（若端口被顺延，以控制台输出为准），保存返回的 JSON 便于定位扫描路径与耗时。

2. **ClawHub 429 / 限流**  
   减少连续搜索/安装间隔；可配置 `SKILL_HUB_CLAWHUB_TOKEN`。服务端在部分错误响应中会返回可读提示。

## TypeScript 与路径别名

- 根 `tsconfig.json`：`@/*` → `web/src/*`（与 Vite `resolve.alias` 一致）。
- `@server/*` 已映射到 `server/*`，可按需在工具脚本或测试中引用；当前应用代码以相对路径为主。

## 代码布局提示

- 新增 HTTP 能力：在 `server/routes/` 增加或扩展路由模块，并在 `server/index.ts` 中 `register`。
- 扫描逻辑变更：优先修改 `server/scanner/`，并注意与 `invalidateCache()`、watcher 的交互。
- Claude / Cursor 插件目录：分别遍历 `~/.claude/plugins/**/skills/` 与 `~/.cursor/plugins/**/skills/`（含 marketplace 缓存）；列表按**路径**保留多条目，不按 `realPath` 合并。
- OpenClaw 仓库根目录的 `skills/`：仅当该项目根下存在 `.openclaw`（文件或目录）时扫描，避免误扫普通仓库的 `skills/` 目录。
- 额外项目发现：环境变量 `SKILL_HUB_PROJECT_ROOTS` 为逗号/冒号分隔的**父目录**列表，对每个存在的目录做一层子目录扫描（与 `~/Projects` 等逻辑相同）；另有 skill 根目录仍可用 `SKILL_HUB_EXTRA_PATHS`。
