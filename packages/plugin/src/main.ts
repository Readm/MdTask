import { MarkdownView, Notice, Plugin } from 'obsidian';
import { taskKeymap } from './cm6';
import { FoldSync } from './fold-sync';
import { MdTaskSettingTab } from './settings';
import { toggleCheckbox } from './editor-ops';

/**
 * MdTask — minimal Obsidian implementation (design principle: reuse native
 * capabilities, see docs/principles.md). Everything that Obsidian already
 * does well is left to Obsidian:
 *
 *   - Tab / Shift+Tab list indentation ........ native
 *   - Cmd+L toggle (Obsidian 1.13+) ........... native
 *   - fold / unfold arrows on list items ...... native (synced to ▼ markers
 *     by FoldSync — the only thing we add on top)
 *   - move line up/down, delete line .......... native commands
 *
 * What MdTask itself provides:
 *   1. Ctrl+Enter toggles the task checkbox (no native binding exists).
 *   2. FoldSync: native fold state <-> trailing-▼ marker (protocol A5).
 *   3. The toggle command (for the palette / user-assigned hotkeys).
 */
export default class MdTaskPlugin extends Plugin {
  override async onload(): Promise<void> {
    // Ctrl+Enter toggle (only key we need to bind ourselves)
    this.registerEditorExtension(taskKeymap());

    // Native fold <-> ▼ marker sync
    new FoldSync(this).start();

    this.addSettingTab(new MdTaskSettingTab(this.app, this));

    this.addCommand({
      id: 'toggle-checkbox',
      name: '切换当前任务勾选 (Ctrl+Enter)',
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        const changed = toggleCheckbox(view.editor);
        if (!changed) new Notice('MdTask：光标不在任务行上');
      },
    });
  }
}
