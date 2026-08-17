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
      text: 'Markdown-first 树状任务工具：Tab 缩进为子任务，Shift+Tab 提升层级，Cmd+Enter 切换勾选（Obsidian 内置）。所有编辑都只改 markdown 文本。',
    });
    containerEl.createEl('p', {
      text: '命令面板中搜索 "MdTask" 可查看全部命令（切换勾选、缩进、提升、插入任务、折叠、上移/下移、删除子树）。',
    });
  }
}
