# Web 前端技术债清偿计划

> **Goal:** 清偿上次代码审阅中归纳的前端技术债：消除死代码与命名歧义、改善视图切换时的状态一致性、降低 `App.tsx` 维护成本，并可选地引入浅层路由以便书签与分享。

**Architecture:** 在不大改产品形态的前提下，先做低风险行为修正与命名统一；再将 `App` 中的批量操作与主内容区抽成 hook/子组件；路由若做则优先用 `react-router` 的 URL 与 `view` 同步，避免与现有 Fastify 静态托管冲突。

**Tech Stack:** React 18、Vite、现有 Vitest/Playwright（见 `docs/testing.md`）。

**优先级：** P0 = 建议本迭代完成；P1 = 下一迭代；P2 = 按需。

---

## 债务清单与目标

| ID | 问题 | 目标 |
|----|------|------|
| TD-1 | `SkillGrid` 支持 `groupBy: 'project'`，但 `App` 未提供入口 | 要么在 UI 暴露「按项目」分组（有项目时），要么从类型与分支中删除 `project`，避免半套实现 |
| TD-2 | 顶栏 `view` 使用 `'clawhub'` 与「技能市场」文案不一致 | 内部枚举统一为 `marketplace`（或 `skillMarket`），全仓库替换引用；对外文案不变 |
| TD-3 | 切换顶栏视图时 `selectMode` / `selectedIds` / `bulkDeleteConfirm` 可能残留 | 视图变化时重置批量相关状态（或仅在离开 `skills`/`conflicts` 时重置） |
| TD-4 | `App.tsx` 过大（状态与 JSX 集中） | 抽出 `useBulkSkillSelection`、`useAppView` 或 `SkillsLayout`/`ConflictsLayout` 等，保持行为不变 |
| TD-5 | 无 URL 与 `view` 同步，无法书签 | 可选：Hash 或 `searchParams`（如 `?view=trash`）与 `view` 双向绑定 |
| TD-6 | 冲突页仅能从 Skills 横幅进入 | 可选：顶栏在 `conflicts.length > 0` 时显示带角标的「冲突」项，与 TD-5 一起做可合并 |

---

## Phase A — 行为与一致性（P0，约 0.5–1 天）

### Task A1: 视图切换时清理批量选择状态

**Files:**
- Modify: `web/src/App.tsx`（`useEffect` 依赖 `[view]`，或封装进自定义 hook）

**Steps:**
1. 当 `view` 从 `skills` 或 `conflicts` 切到其他视图时：设置 `selectMode = false`、`selectedIds = new Set()`、`bulkDeleteConfirm = false`、`bulkDeleteResult = null`。
2. 若从 `conflicts` 切走，同样清理（与 skills 共用状态时尤其重要）。
3. 手工验证：在 Skills 开启批量选择 → 切到仪表盘 → 切回 Skills，确认未仍处于批量模式。

**Verify:** `npm test`；本地 `npm run dev` 上述路径点一点。

---

### Task A2: 处理 `groupBy === 'project'` 死代码或补全 UI

**二选一（产品拍板，默认推荐 A2a）：**

**A2a — 暴露「按项目」分组（推荐，当 `projects.length > 0`）**

**Files:**
- Modify: `web/src/App.tsx`（工具栏 `groupBy` 按钮组增加一项；`GroupBy` 类型已含 `project` 则保持不变）
- Modify: `web/src/components/SkillGrid.tsx`（确认 `groupLabels.project` 如需可读标签可补映射，例如 `全局` / 项目名）

**Steps:**
1. 在「按层级 / 按来源 / 平铺」旁增加「按项目」（或收到 `projects.length === 0` 时禁用该按钮）。
2. 设置 `groupBy('project')` 时，`SkillGrid` 已有按 `projectName` / `全局` 分组逻辑，确认空 `projectName` 显示为「未知项目」已够用。

**A2b — 删除 `project` 分组**

**Files:**
- Modify: `web/src/components/SkillGrid.tsx`（删除 `groupBy === 'project'` 分支及相关类型字面量）
- Modify: `web/src/App.tsx`（若 `GroupBy` 收窄）

**Verify:** 构建通过；列表分组三种或两种模式切换无控制台错误。

---

### Task A3: 内部视图枚举重命名 `clawhub` → `marketplace`

**Files:**
- Modify: `web/src/App.tsx`（`type View`、所有 `setView('clawhub')`、条件 `view === 'clawhub'`）
- Grep: `web/` 下是否还有 `'clawhub'` 作为 **view 键**（勿误改 API/registry 里的 `clawhub` 字符串，如 `/api/clawhub`、`providerId: 'clawhub'`）

**Steps:**
1. 将仅表示「技能市场 Tab」的 `clawhub` 改为 `marketplace`。
2. 全量搜索确认无遗漏；ClawHub API 路径与 provider id 保持不变。

**Verify:** `npm run build`；切换「技能市场」Tab 仍渲染 `MarketplaceView`。

---

## Phase B — 结构重构（P1，约 1–2 天）

### Task B1: 从 `App.tsx` 抽出批量删除逻辑

**Files:**
- Create: `web/src/hooks/useBulkSkillDelete.ts`（或 `useSkillListBulkActions.ts`）
- Modify: `web/src/App.tsx`

**职责:** `selectedIds`、`selectMode`、`bulkDeleteConfirm`、`bulkDeleting`、`bulkDeleteResult`、`toggleSelectMode`、`handleSelectToggle`、`selectAllVisible`、`clearSelection`、`performBulkDelete` 及与 `allSkills`/`skills`/`scan`/`refreshTrashCount` 的依赖。

**Acceptance:** `App.tsx` 行数明显下降；行为与 Phase A 一致；无新增 prop drilling 地狱（可只传回调给子组件）。

---

### Task B2: 拆分主内容区组件（可选与 B1 同 PR）

**Files:**
- Create: `web/src/components/SkillsHomeView.tsx`（或 `SkillsListPage.tsx`）— 包含侧栏 + 工具栏 + `SkillGrid` + 批量条
- Create: `web/src/components/ConflictsPage.tsx` — 若与 `SkillsHomeView` 共享批量条，可再抽 `BulkSelectionToolbar`

**Acceptance:** `App` 只负责 view 路由式条件渲染与 header/footer/modal；逻辑测试可通过现有 E2E 覆盖关键路径。

---

## Phase C — 浅层路由（P2，按需）

### Task C1: URL 与 `view` 同步

**Files:**
- Add dependency: `react-router-dom`（若项目尚未引入）或仅用 `window.history` + `useSearchParams` 自管（YAGNI：优先用已有栈）
- Modify: `web/src/main.tsx`、`web/src/App.tsx`

**建议:**
- 使用 `?view=` 或 hash `#/skills`，避免与生产环境 `index.html` 的 SPA fallback 冲突；对照 `server` 静态资源与 `vite.config.ts`。
- 同步规则：`view` 变化 → 写 URL；首屏 / 浏览器前进后退 → 读 URL 设置 `view`。
- `selectedSkill` 可不在首版进 URL（避免 scope 爆炸）。

**Verify:** 刷新页面保持当前 Tab；`docs/testing.md` 中 E2E 若存在可补一条打开带 query 的 URL。

**实现说明（已落地）：** 未引入 `react-router-dom`；使用 `?view=` 与 `history.pushState` / `popstate`。代码见 `web/src/utils/appViewUrl.ts`、`web/src/hooks/useSyncedAppView.ts`，`App` 通过 `useSyncedAppView()` 取得 `view` / `setView`。非法参数回退为 `skills` 并 `replaceState`。Vitest 包含 `web/src/**/*.test.ts`（`appViewUrl.test.ts`）；Playwright 增加 `?view=trash` 与非法参数用例。

**文档同步：** [development.md](../development.md) 已展开参数表与实现索引；[architecture.md](../architecture.md) 增加 SPA 与地址栏；[api.md](../api.md) 增加「浏览器 UI（非 REST）」说明；[testing.md](../testing.md) 增加 TC-NAV 与 L1/L3 表述；[facts/studio.md](../facts/studio.md)、根 [README](../../README.md)、[AGENTS.md](../../AGENTS.md) 已互链。

---

### Task C2（可选）: 顶栏「冲突」入口

- 当 `conflicts.length > 0` 时显示「冲突」按钮，角标数字；`setView('conflicts')`。
- 与 C1 合并时 URL 可为 `?view=conflicts`。

---

## 回归与发布前检查

- `npm test`
- `npm run build`
- 手工：扫描 → 筛选 → 详情 → 市场安装 → 回收站（`docs/testing.md` P0/P1 用例抽样）
- 若改路由：生产 `npm start` 下刷新子路径不出现 404（需服务端 fallback 与 Vite `base` 一致）

---

## 建议提交策略

- Phase A 单独 PR（行为 + 命名），便于回滚。
- Phase B 紧随或第二个 PR，避免与 A 混在同一巨大 diff。
- Phase C 独立 PR，便于灰度与 QA。

---

## 参考

- [架构概览](../architecture.md)
- [测试计划](../testing.md)
- [开发与调试](../development.md)
