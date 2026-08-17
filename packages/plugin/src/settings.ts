import { App, PluginSettingTab } from 'obsidian';
import type MdTaskPlugin from './main';

export class MdTaskSettingTab extends PluginSettingTab {
  constructor(app: App, plugin: MdTaskPlugin) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'MdTask' });
    containerEl.createEl('p', {
      text: 'Markdown-first 树状任务工具。设计原则：复用 Obsidian 原生能力，不重复造轮子。',
    });
    containerEl.createEl('ul', {})
      .createEl('li', { text: '折叠：直接用编辑器自带的折叠箭头；折叠/展开状态会自动写入任务行尾的 ▶ 标记（协议持久化，多端共享）。文件里带 ▶ 的任务打开时自动折叠。' })
      .createEl('li', { text: '勾选：Ctrl+Enter 切换（Obsidian 内置是 Cmd+L，两条路径都可用）。' })
      .createEl('li', { text: '层级：Tab 缩进为子任务、Shift+Tab 提升（Obsidian 原生列表行为）。' })
      .createEl('li', { text: '移动/删除：Obsidian 原生命令（移动行上/下、删除行）。' });
  }
}
