import { Hotkey, MarkdownView, Notice, Plugin } from 'obsidian';
import { taskIndentExtension } from './cm6';
import { TaskTreeView, VIEW_TYPE_TREE } from './tree-view';
import { MdTaskSettingTab } from './settings';
import { applyPrimitive } from './editor-ops';

export default class MdTaskPlugin extends Plugin {
  override async onload(): Promise<void> {
    // Tree view panel (C5)
    this.registerView(VIEW_TYPE_TREE, (leaf) => new TaskTreeView(leaf));

    // Tab / Shift+Tab on task lines (C2)
    this.registerEditorExtension(taskIndentExtension());

    // Settings page (C1, minimal)
    this.addSettingTab(new MdTaskSettingTab(this.app, this));

    // Commands (C6). No default hotkeys except where noted — users bind
    // their own in Obsidian's hotkey settings (Cmd+Enter is built-in).
    this.addCommand({
      id: 'open-task-tree',
      name: '打开 MdTask 任务树视图',
      callback: () => this.activateTreeView(),
    });

    // Ctrl+Enter is bound explicitly: Obsidian 1.13 renamed its built-in
    // toggle command (Cmd+L), so relying on the old default leaves no binding.
    this.editCommand('toggle-checkbox', '切换当前任务勾选', 'toggle', [
      { modifiers: ['Ctrl'], key: 'Enter' },
    ]);
    this.editCommand('indent-task', '缩进为子任务', 'indent');
    this.editCommand('outdent-task', '提升层级', 'outdent');
    this.editCommand('insert-task', '在当前任务后插入任务', 'insert');
    this.editCommand('move-task-up', '任务上移（含子树）', 'moveUp');
    this.editCommand('move-task-down', '任务下移（含子树）', 'moveDown');
    this.editCommand('fold-task', '折叠当前子树', 'fold');
    this.editCommand('unfold-task', '展开当前子树', 'unfold');
    this.editCommand('delete-task', '删除当前任务（含子树）', 'delete');
  }

  private editCommand(
    id: string,
    name: string,
    primitive: Parameters<typeof applyPrimitive>[1],
    hotkeys?: Hotkey[],
  ): void {
    this.addCommand({
      id,
      name,
      hotkeys,
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        const changed = applyPrimitive(view.editor, primitive);
        if (!changed) {
          new Notice('MdTask：光标不在任务行上');
          return;
        }
        if (primitive === 'delete') {
          new Notice('MdTask：已删除（Ctrl+Z 可撤销）');
        }
      },
    });
  }

  private activateTreeView(): void {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_TREE)[0];
    if (existing) {
      workspace.revealLeaf(existing);
      return;
    }
    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;
    void leaf.setViewState({ type: VIEW_TYPE_TREE, active: true });
    workspace.revealLeaf(leaf);
  }
}
