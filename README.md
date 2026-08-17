# MdTask

Markdown-first 树状任务工具：**任务就是纯 markdown 文本**，没有任何私有存储格式。

> MdTask is a markdown-first tree todo tool: your tasks ARE plain markdown files.

- 面向会用 markdown 的人：零学习成本，Tab 缩进为子任务，Shift+Tab 提升层级，` ▼` 折叠子树，完成的任务永远留在列表里
- **协议 + 多应用**：核心是一份格式规范（`docs/protocol.md`），Obsidian 插件是第一个实现，桌面/手机 app 在路上
- 多端同步友好：文件即数据库，配合 iCloud / Syncthing / Git 任意同步方案
- 兼容 [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) 格式（单向子集，存量笔记零迁移）

## 用法 Usage

在 Obsidian 中启用插件后（设置 → 第三方插件）：

| 操作 | 方式 |
|------|------|
| 缩进为子任务 | 光标在任务行按 `Tab` |
| 提升层级 | `Shift+Tab` |
| 切换勾选 | `Ctrl+Enter`（插件绑定）或任务树视图中点击 |
| 折叠/展开子树 | 命令面板：MdTask 折叠/展开；或任务树视图点 `▼`/`▶` |
| 插入任务 / 上移 / 下移 / 删除（含子树） | 命令面板搜 "MdTask" |

> 说明：Obsidian 1.13 起内置勾选命令改用 `Cmd+L`，MdTask 插件显式绑定
> `Ctrl+Enter` 到自己的切换命令（可在 Obsidian 快捷键设置中改绑）。

折叠状态通过行尾 ` ▼` 标记写入文件——展开无标记，文件始终是干净的标准 markdown。
Collapse state is stored as a trailing ` ▼` marker — expanded tasks carry no marker.

任务树视图：命令面板 → "打开 MdTask 任务树视图"，当前文件的任务以树形展示，
点击勾选直接回写文件，已完成任务保留原位（淡化不隐藏——不会消失）。

## 开发 Development

```bash
npm install
npm test          # core 单元测试（35+ 用例，含 10MB 性能验收）
npm run dev       # GUI 壳开发服务器（http://localhost:5173）
npm run typecheck # 全包类型检查
npm run build     # 构建 core + app + Obsidian 插件
```

插件产物在 `packages/plugin/dist/`（main.js + manifest.json + styles.css），
复制到任意 vault 的 `.obsidian/plugins/md-task/` 即可加载。

## 项目结构 Structure

```
MdTask/
├── docs/
│   ├── protocol.md    # 协议规范（格式宪法，所有实现以此为准）
│   ├── interop.md     # 与 Obsidian 原生功能的冲突处理（行为边界）
│   ├── VISION.md      # 产品愿景与决策记录
│   └── FEATURES.md    # 功能清单与优先级
├── packages/
│   ├── core/          # @md-task/core 协议参考实现（纯 TS，零依赖）
│   ├── plugin/        # @md-task/plugin Obsidian 插件（首个实现）
│   └── app/           # @md-task/app GUI 壳（Vite；桌面 Tauri 套壳前身）
└── tsconfig.base.json
```

## Roadmap

- [x] v0.1 monorepo 骨架
- [x] v0.2 协议文档 + core（解析/编辑原语/性能）+ Obsidian 插件 MVP（编辑核心 + 树视图）
- [ ] 桌面 app（Tauri）：文件夹模式、文件监听热刷新、轻量冲突提示
- [ ] 手机 app：触屏树编辑（iOS/Android）
- [ ] 插件上架 Obsidian 社区市场

## 已知缺口 Known gaps (v0.2)

- 代码块内形如 `- [ ]` 的行**不会**被识别为任务（协议 A3：核心解析器按行级规则、
  不感知代码块；壳层感知是后续版本的工作，v0.2 未实现）。含代码块的笔记中，
  编辑器 Tab/Shift+Tab 仍会对代码块内的这类行生效——如需规避请手动调整。
  Code-fence awareness is a shell-layer duty (protocol §6); not implemented in v0.2.

## 致谢 Acknowledgements

任务格式与设计理念参考 [obsidian-tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)
（MIT License）。MdTask 自研核心实现，未复用其代码；本协议是其格式的子集，
obsidian-tasks 可无缝读取 MdTask 文件。

## License

[MIT](LICENSE) © 2026 Readm
