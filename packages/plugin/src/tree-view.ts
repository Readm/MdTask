import { ItemView, WorkspaceLeaf, MarkdownView, EventRef } from 'obsidian';
import * as core from '@md-task/core';
import { applyPrimitive } from './editor-ops';

export const VIEW_TYPE_TREE = 'mdtask-tree-view';

interface TreeNode {
  task: core.Task;
  children: TreeNode[];
}

/**
 * Tree view of the current file's tasks (docs/FEATURES.md C5).
 * Clicking a checkbox toggles it in the file; ▼/▶ folds/unfolds via the
 * in-file collapse marker. Done tasks stay in place — they never disappear.
 */
export class TaskTreeView extends ItemView {
  private container?: HTMLElement;
  private refreshTimer: number | undefined;
  private unsubs: EventRef[] = [];
  /**
   * Last known markdown view. Opening the tree leaf makes IT the active leaf,
   * so we must not depend on getActiveViewOfType(MarkdownView) after that —
   * cache the view instead (GUI test found this as the 'placeholder text on
   * first open' defect).
   */
  private cachedView: MarkdownView | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  override getViewType(): string {
    return VIEW_TYPE_TREE;
  }

  override getDisplayText(): string {
    return 'MdTask 任务树';
  }

  override getIcon(): string {
    return 'list-tree';
  }

  override async onOpen(): Promise<void> {
    const c = this.containerEl.children[1] as HTMLElement;
    c.empty();
    c.addClass('mdtask-tree');
    this.container = c;
    this.render();

    const w = this.app.workspace;
    this.unsubs.push(w.on('active-leaf-change', () => this.scheduleRender()));
    this.unsubs.push(w.on('file-open', () => this.scheduleRender()));
    this.unsubs.push(w.on('editor-change', () => this.scheduleRender()));
  }

  override async onClose(): Promise<void> {
    window.clearTimeout(this.refreshTimer);
    for (const ref of this.unsubs) this.app.workspace.offref(ref);
    this.unsubs = [];
    this.cachedView = null;
  }

  private scheduleRender(): void {
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.render(), 120);
  }

  private activeMarkdown(): MarkdownView | null {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active) this.cachedView = active;
    return this.cachedView;
  }

  private render(): void {
    const c = this.container;
    if (!c) return;
    const view = this.activeMarkdown();
    if (!view) {
      c.setText('打开一个 markdown 文件，这里显示它的任务树');
      return;
    }
    const doc = core.parseDocument(view.editor.getValue());
    const tree = buildTree(doc.tasks);
    c.empty();
    if (tree.length === 0) {
      c.setText('当前文件没有任务');
      return;
    }
    const ul = document.createElement('ul');
    ul.addClass('mdtask-root');
    for (const node of tree) ul.appendChild(this.renderNode(node, view));
    c.appendChild(ul);
  }

  private renderNode(node: TreeNode, view: MarkdownView): HTMLElement {
    const li = document.createElement('li');
    li.addClass('mdtask-node');

    if (node.children.length > 0) {
      const btn = document.createElement('span');
      btn.addClass('mdtask-collapse');
      btn.textContent = node.task.collapsed ? '▶' : '▼';
      btn.addEventListener('click', () => {
        applyPrimitive(view.editor, node.task.collapsed ? 'unfold' : 'fold', undefined, node.task.lineNumber);
        this.scheduleRender();
      });
      li.appendChild(btn);
    }

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = node.task.completed;
    cb.addClass('mdtask-checkbox');
    cb.addEventListener('change', () => {
      applyPrimitive(view.editor, 'toggle', undefined, node.task.lineNumber);
      this.scheduleRender();
    });
    li.appendChild(cb);

    const span = document.createElement('span');
    span.addClass('mdtask-text');
    span.textContent = node.task.text || '(空任务)';
    li.appendChild(span);

    if (!node.task.collapsed) {
      const ul = document.createElement('ul');
      for (const child of node.children) ul.appendChild(this.renderNode(child, view));
      li.appendChild(ul);
    }
    return li;
  }
}

/** Build the task tree from flat tasks using indentation (docs/protocol.md §3). */
export function buildTree(tasks: core.Task[]): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: { depth: number; node: TreeNode }[] = [];
  for (const t of tasks) {
    const depth = core.indentLength(t.raw);
    const node: TreeNode = { task: t, children: [] };
    let top = stack[stack.length - 1];
    while (top && top.depth >= depth) {
      stack.pop();
      top = stack[stack.length - 1];
    }
    if (top) top.node.children.push(node);
    else root.push(node);
    stack.push({ depth, node });
  }
  return root;
}
