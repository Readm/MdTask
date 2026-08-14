# MdTask

Markdown-first 任务管理工具：**任务就是纯 markdown 文本**，没有任何私有存储格式。

- 兼容 [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 的任务格式（checkbox + emoji 元数据），存量笔记零迁移
- 不绑定 Obsidian：独立图形界面，你的笔记文件仍然是普通 `.md` 文件
- 多端同步友好：文件即数据库，配合 Syncthing / iCloud / Git 等任意同步方案，应用监听文件变更热刷新

## 项目结构

```
MdTask/
├── packages/
│   ├── core/          # @md-task/core  任务解析/查询引擎（纯 TS，零运行时依赖）
│   └── app/           # @md-task/app   GUI 壳（Vite + TS，未来 Tauri 套壳）
├── package.json       # npm workspaces 根
└── tsconfig.base.json
```

## 开发

```bash
npm install
npm test          # core 单元测试（node:test + tsx）
npm run dev       # GUI 开发服务器 (http://localhost:5173)
npm run build     # 构建 core + app
```

## Roadmap

- [x] Monorepo 骨架 + 最小 markdown 任务行解析器（v0.1）
- [ ] 完整任务模型：due/scheduled/start/done 日期、优先级、重复任务、自定义状态（迁移自 obsidian-tasks 核心，MIT）
- [ ] 查询 DSL（````tasks` 语法兼容）
- [ ] 文件夹扫描 + 文件监听（多端同步热刷新）
- [ ] 任务编辑回写（原地 patch，保持其他 markdown 内容不变）
- [ ] GUI：任务列表 / 看板 / 日历视图
- [ ] Tauri 桌面壳（需要 Rust 工具链）

## 致谢

任务格式与核心设计参考 [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)（MIT License），其核心解析/查询模块计划以 MIT 许可直接抽取复用。

## License

[MIT](LICENSE) © 2026 Readm
