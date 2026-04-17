# 测试计划与用例

本文档与 [HTTP API](./api.md)、[架构概览](./architecture.md)、[开发与调试](./development.md) 及需求说明（扫描、管理、版本、市场等能力）对齐，用于手工回归与自动化。仓库已使用 **Vitest**（`npm test`）、**Playwright**（`npm run test:e2e`，需先 `npm run build`）与 [GitHub Actions CI](../.github/workflows/ci.yml)；文末补充可扩展的落地建议。

## 1. 测试目标与范围


| 目标    | 说明                                         |
| ----- | ------------------------------------------ |
| 功能正确性 | 核心路径：扫描 → 列表/筛选 → 详情/编辑 → 启用禁用 → 版本 → 回收站  |
| 数据一致性 | 删除/恢复/回滚后磁盘、`settings.json`、列表缓存一致         |
| 集成边界  | ClawHub/镜像为外部依赖，采用「可 mock 的契约测试」+ 少量真实网络冒烟 |
| 安全基线  | 自定义市场 URL 的 HTTPS/SSRF 约束、本机服务暴露面说明        |


**范围外（除非产品明确要求）**：第三方门户页面内容正确性、ClawHub 服务端 SLA、用户本机非标准目录布局的穷举。

## 2. 测试层级与策略


| 层级        | 对象                                   | 策略                                           |
| --------- | ------------------------------------ | -------------------------------------------- |
| L1 单元     | `server/marketplace/ssrf.ts`、纯函数、解析器 | 不依赖 HTTP，快速、可全量跑                             |
| L2 API 集成 | Fastify 路由 + 临时目录 fixture            | 使用 `inject()` 或独立进程 + `fetch`，覆盖 JSON 形状与状态码 |
| L3 UI/E2E | React 关键流程                           | 优先「市场切换 + 扫描按钮 + 详情弹窗」；全量可用 Playwright       |
| L4 手工/探索  | 多项目真实目录、插件 skills                    | 发版前抽样                                        |


**优先级定义**：P0 阻塞发布；P1 核心路径；P2 重要边界；P3 体验与锦上添花。

## 3. 测试环境与前置条件

### 3.1 通用前置

- Node.js ≥ 20；`npm install`；`npm run dev` 或 `npm run build && npm start`。
- 浏览器可访问控制台输出的本机地址（端口以启动日志为准）。
- 测试专用 **HOME** 或 **独立技能目录**：避免误删真实 `~/.claude/skills`。推荐：
  ```bash
  export SKILL_HUB_EXTRA_PATHS=/path/to/fixture-skills-root
  export SKILL_HUB_PROJECT_ROOTS=/path/to/parent-of-fixture-repos
  ```
- `SKILL_HUB_PROJECT_ROOTS`：可选，指向若干**父目录**，用于在测试中把含 `.claude/skills` 等的 fixture 仓库纳入项目发现。
- 记录：`/api/debug` 输出作为环境基线。

### 3.2 测试数据（Fixture）建议

在仓库外或 `fixtures/`（若后续加入）准备：

- **最小 skill**：含合法 `SKILL.md`（front matter 可选）的目录。  
若使用 `SKILL_HUB_EXTRA_PATHS`，路径须指向**父目录**：其下每个**子文件夹**为一项 skill（与 `~/.claude/skills/` 布局一致）。仓库内示例见 `test/fixtures/extra-skills-root/minimal/SKILL.md`。
- **同名冲突**：两个路径下同名 skill 目录。
- **相似内容**：两段高度相似的 `SKILL.md` 用于相似度列表非空。
- **settings**：可备份后替换的 `settings.json` 片段用于验证 `permissions.deny`。

## 4. 需求追溯简表


| 需求域   | 代表能力                                 | 用例前缀         |
| ----- | ------------------------------------ | ------------ |
| 扫描与列表 | `/api/scan`、`/api/skills`、筛选         | TC-SCAN-xxx  |
| 编辑与管理 | 内容保存、toggle、copy、move、删除             | TC-MGT-xxx   |
| 版本    | snapshot、history、diff、rollback       | TC-VER-xxx   |
| 相似    | `/api/similar`、ignore                | TC-SIM-xxx   |
| 冲突    | `/api/conflicts`、冲突视图操作              | TC-CONF-xxx  |
| 回收站   | trash CRUD、过期                        | TC-TRASH-xxx |
| 仪表盘   | 统计展示                                 | TC-DASH-xxx  |
| 市场    | providers、clawhub、skillhub-cn、外链、智能体 | TC-MKT-xxx   |
| 实时    | WebSocket 广播                         | TC-WS-xxx    |
| 诊断    | health、debug                         | TC-OPS-xxx   |
| 安全    | 自定义预设 SSRF/HTTPS                     | TC-SEC-xxx   |


## 5. 用例详表

### 5.1 运维与诊断（TC-OPS）


| ID         | 优先级 | 前置               | 步骤                | 期望                                   |
| ---------- | --- | ---------------- | ----------------- | ------------------------------------ |
| TC-OPS-001 | P0  | 服务已启动            | GET `/api/health` | `status` 为 `ok`（或文档约定字段）             |
| TC-OPS-002 | P0  | 同上               | GET `/api/debug`  | JSON 含 node、cwd、homedir、路径与命中等；无 500 |
| TC-OPS-003 | P2  | 改 `PORT` 或占用默认端口 | 启动应用              | 控制台显示实际端口；UI/API 在该端口可访问             |


### 5.2 扫描与列表（TC-SCAN）


| ID          | 优先级 | 前置                      | 步骤                                             | 期望                                              |
| ----------- | --- | ----------------------- | ---------------------------------------------- | ----------------------------------------------- |
| TC-SCAN-001 | P0  | fixture 含至少 1 个 skill   | GET `/api/scan` 再 GET `/api/skills`            | `ok`；列表非空；条目含 id、path、name 等关键字段                |
| TC-SCAN-002 | P1  | 同上                      | GET `/api/skills?search=<关键词>`                 | 仅返回名称/描述匹配项（行为与实现一致）                            |
| TC-SCAN-003 | P1  | 多 scope fixture         | 分别带 `scope=`、`source=`、`agent=`、`search=` 查询   | 过滤结果与参数一致；空集时返回空数组而非报错（当前 API 无 `project` 查询参数） |
| TC-SCAN-004 | P1  | 同上                      | GET `/api/stats`、`/api/projects`、`/api/agents` | 与列表聚合一致、无矛盾                                     |
| TC-SCAN-005 | P2  | 向 fixture 目录新增 skill 文件 | 点击「一键扫描」或 POST 触发扫描                            | 新 skill 出现；与 TC-WS-001 可合并验证                    |


### 5.3 编辑与管理（TC-MGT）


| ID         | 优先级 | 前置             | 步骤                                                            | 期望                                    |
| ---------- | --- | -------------- | ------------------------------------------------------------- | ------------------------------------- |
| TC-MGT-001 | P0  | 选中测试 skill     | PUT `/api/skills/:id/content`，body 含 `realPath` 与合法 `content` | `ok`；磁盘 `SKILL.md` 与请求一致              |
| TC-MGT-002 | P0  | 同上             | PUT `/api/skills/:id/toggle`，`enabled: false`                 | `settings.json` 出现对应 deny 规则（或实现约定位置） |
| TC-MGT-003 | P0  | toggle 为 false | 再次 toggle `enabled: true`                                     | 规则移除或等价于启用                            |
| TC-MGT-004 | P1  | 两个路径可写         | POST `/api/skills/copy` 到全局或项目                                | 目标路径出现副本；列表有两条或按实现去重展示                |
| TC-MGT-005 | P1  | 同上             | POST `/api/skills/move`                                       | 源路径移除或为空；目标存在                         |
| TC-MGT-006 | P0  | 任意 skill       | DELETE `/api/skills/:id`，body 含 `path`                        | 文件进入回收站逻辑；GET `/api/trash` 可见         |
| TC-MGT-007 | P1  | 选中多条           | POST `/api/skills/batch/delete`                               | `okCount`/`failCount` 符合预期；成功项进回收站    |


### 5.4 版本历史（TC-VER）


| ID         | 优先级 | 前置       | 步骤                                                      | 期望                                            |
| ---------- | --- | -------- | ------------------------------------------------------- | --------------------------------------------- |
| TC-VER-001 | P1  | 可写 skill | POST `/api/versions/snapshot`                           | 新版本出现在 GET `/api/versions/history?skillPath=` |
| TC-VER-002 | P1  | 至少 2 版本  | GET `/api/versions/diff` 与 `/api/versions/diff-current` | 返回可读的 diff 结构                                 |
| TC-VER-003 | P0  | 存在历史版本   | POST `/api/versions/rollback`                           | 磁盘内容与所选版本一致；列表刷新后一致                           |
| TC-VER-004 | P2  | 有多余版本    | DELETE `/api/versions`（若支持）                             | 指定版本删除；当前版本不受影响                               |


### 5.5 相似技能（TC-SIM）


| ID         | 优先级 | 前置          | 步骤                           | 期望                                           |
| ---------- | --- | ----------- | ---------------------------- | -------------------------------------------- |
| TC-SIM-001 | P2  | 相似 fixture  | GET `/api/similar`           | 返回配对列表；调高/调低 `threshold` 结果数量变化合理            |
| TC-SIM-002 | P2  | 一对可识别 skill | POST `/api/similar/ignore`   | 该对不再出现在默认相似列表；GET `/api/similar/ignored` 含该对 |
| TC-SIM-003 | P2  | 已忽略         | POST `/api/similar/unignore` | 配对重新可出现                                      |


### 5.6 同名冲突（TC-CONF）


| ID          | 优先级 | 前置         | 步骤                   | 期望                 |
| ----------- | --- | ---------- | -------------------- | ------------------ |
| TC-CONF-001 | P1  | 同名 fixture | GET `/api/conflicts` | 冲突组非空；与 UI「冲突」入口一致 |
| TC-CONF-002 | P1  | UI         | 打开冲突视图，对一条执行删除       | 该项进回收站；冲突组更新或消失    |


### 5.7 回收站（TC-TRASH）


| ID           | 优先级 | 前置        | 步骤                                    | 期望                   |
| ------------ | --- | --------- | ------------------------------------- | -------------------- |
| TC-TRASH-001 | P0  | 至少 1 条回收项 | GET `/api/trash`                      | 列表含元数据；badge 与 UI 一致 |
| TC-TRASH-002 | P0  | 同上        | POST `/api/trash/:id/restore`         | 文件回到原路径或文档约定位置；列表减少  |
| TC-TRASH-003 | P1  | 同上        | DELETE `/api/trash/:id`               | 永久删除；磁盘无残留           |
| TC-TRASH-004 | P2  | 有过期策略     | POST `/api/trash/purge-expired` 或等待过期 | 过期项被清理               |


### 5.8 仪表盘（TC-DASH）


| ID          | 优先级 | 前置     | 步骤      | 期望                        |
| ----------- | --- | ------ | ------- | ------------------------- |
| TC-DASH-001 | P2  | 有技能与项目 | 打开仪表盘视图 | 统计与 `/api/stats`、项目列表无矛盾  |
| TC-DASH-002 | P3  | 存在冲突   | 同上      | 冲突数量与 `/api/conflicts` 一致 |


### 5.9 技能市场（TC-MKT）


| ID         | 优先级 | 前置              | 步骤                                                | 期望                                                               |
| ---------- | --- | --------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| TC-MKT-001 | P0  | 服务启动            | GET `/api/marketplace/providers`                  | `ok`；`providers` 为数组；含内置 id（如 clawhub、link-catalog、agent-guided） |
| TC-MKT-002 | P1  | 网络可用            | GET `/api/clawhub/search?q=test&limit=5`          | 200 或文档约定限流响应；JSON 可解析                                           |
| TC-MKT-003 | P1  | 同上              | GET `/api/clawhub/skills?limit=5`                 | 列表结构稳定（有分页字段则校验类型）                                               |
| TC-MKT-004 | P0  | fixture 目标可写    | POST `/api/clawhub/install`（使用测试 slug，安装到临时目录若支持） | 成功时目标出现 skill；失败时 `error` 可读                                     |
| TC-MKT-005 | P2  | 本机已装 `skillhub` | GET `/api/skillhub-cn/status`                     | 反映已安装                                                            |
| TC-MKT-006 | P2  | 未安装 CLI         | 卸载或改名 CLI                                         | status 反映未安装；安装接口错误提示友好                                          |
| TC-MKT-007 | P3  | UI              | 切换「外链目录」「智能体发现」                                   | 展示对应视图；智能体页可复制提示词（剪贴板权限因浏览器而异）                                   |
| TC-MKT-008 | P1  | UI              | 设置中切换 provider 后进入技能市场                            | 子视图与 `kind` 一致（HTTP / CLI / link-only / agent-guided）            |


### 5.10 WebSocket（TC-WS）


| ID        | 优先级 | 前置      | 步骤                                    | 期望                                               |
| --------- | --- | ------- | ------------------------------------- | ------------------------------------------------ |
| TC-WS-001 | P1  | 浏览器打开应用 | 连接 `/ws`；在 fixture 中修改某 `SKILL.md` 保存 | 收到 `type: change`（或当前实现约定）；列表自动刷新或 lastUpdate 更新 |


### 5.11 安全：自定义市场预设（TC-SEC）


| ID         | 优先级 | 前置                                                          | 步骤   | 期望                                                               |
| ---------- | --- | ----------------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| TC-SEC-001 | P0  | 设置 `SKILL_HUB_MARKETPLACE_PRESETS_JSON` 含 `http://` 或内网 URL | 启动服务 | 该项被跳过或拒绝；日志有警告（与 [AGENT_MARKETPLACE](./AGENT_MARKETPLACE.md) 一致） |
| TC-SEC-002 | P0  | JSON 中 `id` 与保留 id 冲突                                       | 启动   | 不合并进 providers 或跳过并告警                                            |
| TC-SEC-003 | P1  | 合法 `https` 公网 registry                                      | 启动   | GET `/api/marketplace/providers` 含自定义项                           |


## 6. 非功能与回归


| 项         | 说明                                                         |
| --------- | ---------------------------------------------------------- |
| 构建        | `npm run build` 无错误；`npm start` 能加载 `dist/web`（非 API-only） |
| 性能冒烟      | 在「中等规模」fixture（例如 50+ skill）下扫描在可接受时间完成，UI 可操作             |
| 无障碍/基础 UI | 关键按钮有 `aria-label` 或 title（与现有组件一致即可）                      |


## 7. 发布前检查清单（简）

- TC-OPS-001、TC-OPS-002 通过  
- TC-SCAN-001、TC-MGT-001、TC-MGT-002、TC-MGT-006 通过  
- TC-TRASH-001、TC-TRASH-002 通过  
- TC-MKT-001、TC-MKT-002（或记录外部服务不可用）通过  
- TC-SEC-001 通过（自定义预设场景若启用）  
- `npm test` 通过（若改动触及服务端逻辑或市场 URL 校验）  
- `npm run build` 成功

## 8. 自动化落地建议（可选扩展）


| 状态  | 内容                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| 已有  | **Vitest**：`server/marketplace/ssrf.test.ts` 等；`server/api.integration.test.ts` 使用 Fastify `inject`                     |
| 已有  | **Playwright**：`e2e/smoke.spec.ts`；先 `npm run build` 再 `npm run test:e2e`                                               |
| 已有  | **CI**：`.github/workflows/ci.yml` 依次 `npm ci` → `npm test` → `npm run build` → Playwright Chromium → `npm run test:e2e` |
| 可选  | 扩大 `inject` 覆盖（fixture 目录 + 环境变量）、增加 UI 场景与视觉回归                                                                         |


---

**维护**：API 或行为变更时，同步更新 [api.md](./api.md) 与本表对应步骤/期望。