# Skill Hub

> Claude Skill 可视化管理器 — 一键扫描并管理你机器上所有 Claude Agent Skills。

## 它解决了什么问题

当你装了几十个 Skill 后，你会遇到：

- 同名 Skill 散落在不同目录（`~/.claude/skills/`、插件、各个项目的 `.claude/skills/`）
- 想改个 Skill 得手动翻目录
- 不知道哪些是全局、哪些是项目私有、哪些来自插件、哪些重复了
- 改坏了想回滚，没有版本历史

Skill Hub 是一个本地 Web UI：扫描全盘、聚合展示、可视化编辑、自动版本快照。

## 核心功能


| 能力        | 说明                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| **多路径扫描** | 自动发现 `~/.claude/skills/`、插件目录、已注册项目与常见工作区下的 Skills，并支持环境变量扩展扫描范围（见下文「扫描覆盖的位置」）。                                     |
| **列表与筛选** | 左侧按**层级**（全局 / 项目 / 插件等）、**Agent 类型**、**项目**筛选；支持关键词搜索，快速定位名称或描述。                                                   |
| **编辑与版本** | 在界面中打开、编辑各 Skill 的 `SKILL.md`；保存时可写入**版本快照**，便于对比与回滚。                                                               |
| **冲突与相似** | **冲突**页汇总同名或路径重叠问题；**相似检测**页按内容相似度辅助发现重复或近似的 Skill。                                                                 |
| **回收站**   | 删除进入软删除与回收站，降低误删成本。                                                                                                 |
| **仪表盘**   | 顶栏 **仪表盘** 汇总统计与一览。                                                                                                 |
| **技能市场**  | 聚合搜索 **ClawHub** 等兼容 HTTP 源，浏览元数据并将 Skill **安装**到本机约定目录（详见 [docs/AGENT_MARKETPLACE.md](docs/AGENT_MARKETPLACE.md)）。 |
| **实时刷新**  | 监听文件变更并通过 WebSocket 提示列表更新；也可随时点击**一键扫描**强制刷新。                                                                      |


## 使用说明

1. **启动**
  安装并执行全局命令 `skill-hub`（见下一节）。默认在浏览器打开 `http://127.0.0.1:3456`（若端口占用会自动顺延，以终端输出为准）。
2. **顶栏切换主视图**
  使用顶部导航在以下页面间切换（与界面文案一致）：
  - **Skills**：主列表，管理已扫描到的 Skill。  
  - **相似检测**：按相似度分组，辅助发现重复或近似的 Skill。  
  - **仪表盘**：统计与总览。  
  - **冲突**（有冲突时显示）：同名或路径冲突列表。  
  - **技能市场**：聚合搜索 ClawHub 等源并安装 Skill。  
  - **回收站**：软删除与恢复。
3. **左侧筛选与搜索**
  在 Skills 等视图下，用左侧筛选项缩小范围；在「层级」区域旁使用搜索框按关键词过滤列表。
4. **扫描与排错**
  若列表未更新，点击**一键扫描**。若数量异常或白屏，打开 `http://localhost:<端口>/api/debug`（端口同控制台）查看扫描路径与诊断信息。
5. **书签与直达某一屏**  
   在地址栏使用查询参数 **`view`** 可打开指定顶栏页，便于收藏或脚本打开。合法取值：`skills`、`similar`、`dashboard`、`trash`、`conflicts`、`marketplace`。示例：`http://127.0.0.1:3456/?view=marketplace`。开发模式下若使用 Vite 独立端口，同样可带 `?view=`（详见 [docs/development.md](docs/development.md)「前端 URL 与顶栏视图」）。

更多环境变量、ClawHub 与市场配置见 [docs/development.md](docs/development.md)。

## 快速开始（一行命令）

```bash
npm install -g claude-skill-hub && skill-hub
```

若 npm 上尚未发布该包，可在克隆本仓库后在项目根目录执行 `npm run build && npm install -g .`，再使用 `skill-hub` 启动。

首次运行会自动：

1. 下载预构建的 tarball 并全局安装
2. 安装运行期依赖
3. 启动服务并打开浏览器到 `http://localhost:3456`

**之后每次启动只要敲 `skill-hub` 就行**，不用再打这串长命令。

要求：Node.js ≥ 20。

> **为什么用 tarball URL 而不是 `github:user/repo`**：npm 11 + node 24 在 macOS 上通过 `npm install -g github:...` 全局安装时，会把包软链到 `~/.npm/_cacache/tmp/` 里的临时克隆目录，随后临时目录被清理、留下悬空符号链接导致 `skill-hub` 无法运行。直接装预构建 tarball 走的是真正的文件拷贝路径，完全绕开这个 bug。
>
> **更新到最新版**：再跑一次同样的命令即可。
>
> **卸载**：`npm uninstall -g claude-skill-hub`。

## 扫描覆盖的位置

- `~/.claude/skills/` — 全局 skill
- `~/.claude/plugins/**/skills/` — Claude Code 插件附带的 skill（递归扫描）
- `~/.claude/projects/*` 里注册过的项目 `.claude/skills/`
- 常见开发目录：`~/Documents`、`~/Projects`、`~/Developer`、`~/Code`、`~/code`、`~/workspace`、`~/dev`、`~/work`、`~/repos`、`~/src` 下一层的项目
- 当前工作目录及其向上 3 级目录的 `.claude/skills/`
- 环境变量 `SKILL_HUB_EXTRA_PATHS=/path/a:/path/b` 指定的额外路径

## 排查问题

如果发现扫到的 skill 数量不对、或者页面打开是白屏，访问：

```
http://localhost:3456/api/debug
```

返回 JSON 包含：node 版本、cwd、homedir、所有被扫的路径及每个路径的命中数、耗时、错误。报 bug 时发这份 JSON 即可快速定位。

## 本地开发

```bash
git clone <仓库地址>
cd <项目目录>

npm install
npm run dev       # 开发模式：前端 5173 + 后端 3456
```

生产模式：

```bash
npm run build
npm start
```

### 书签与直达某一屏

见上文「使用说明」第 5 步；开发与生产端口差异见 [docs/development.md](docs/development.md)「前端 URL 与顶栏视图」。

## 可选环境变量

- `PORT` — 自定义起始端口（默认 3456；占用时自动向上尝试后续若干端口）
- `SKILL_HUB_NO_OPEN=1` — 启动时不自动打开浏览器
- `SKILL_HUB_EXTRA_PATHS` — 额外的扫描路径，冒号或逗号分隔
- `SKILL_HUB_PROJECT_ROOTS` — 逗号/冒号分隔的**父目录**列表，对其每个子目录做一层项目发现（与 `~/Projects` 等逻辑相同）

更多（关闭文件监听、ClawHub、市场预设 JSON 等）见 [docs/development.md#环境变量](docs/development.md#环境变量)。

## 目录结构

- `server/` — Fastify 后端（API + WebSocket + 文件监听 + 扫描器）
- `web/` — React + Vite + Tailwind 前端（含 ErrorBoundary）
- `bin/` — CLI 入口与首次安装构建脚本
- `docs/` — 架构说明、API 概览、开发调试（见 [docs/README.md](docs/README.md)）；内置说明型 SKILL 见 [skills/README.md](skills/README.md)（与 `~/.claude/skills` 安装目录无关）

## 鸣谢

本项目基于 [Backtthefuture/huangshu](https://github.com/Backtthefuture/huangshu.git) 仓库中的 **skill-hub** 改造、演进而来。

## 许可

MIT