# 示例输出与 JSON 形状

便于对照实现做排错或自动化断言。字段以当前代码为准；若有变更请同步本文档与 [api.md](../api.md)。

## `GET /api/health`

```json
{ "status": "ok" }
```

## `GET /api/debug`

典型结构（`version` 与 `package.json` 的 `version` 一致）：

```json
{
  "version": "<与 package.json 的 version 一致>",
  "node": "v20.x.x",
  "platform": "win32",
  "cwd": "/path/to/project",
  "homedir": "/home/user",
  "env": {
    "SKILL_HUB_EXTRA_PATHS": null,
    "PORT": null
  },
  "scan": {
    "durationMs": 123,
    "totalSkills": 0,
    "scannedPaths": [
      { "path": "...", "count": 0, "error": null }
    ]
  },
  "stats": {}
}
```

- `scannedPaths` 中每项含扫描根路径、该路径下发现的 skill 数、以及可选错误信息。
- `stats` 为扫描聚合统计（与 `GET /api/stats` 等业务一致的数据源）。

## `GET /api/skills`

列表响应包含 `skills` 数组与 `stats`；查询参数支持 `scope`、`source`、`agent`、`search`（均为可选筛选，见 [api.md](../api.md)）。**当前实现不包含** `project` 查询参数。

## WebSocket `/ws`

客户端收到字符串消息，`JSON.parse` 后为对象，例如文件变更：

```json
{
  "type": "change",
  "event": {}
}
```

`event` 的具体字段随 chokidar 与封装方式变化，UI 仅依赖 `type` 触发刷新即可。
