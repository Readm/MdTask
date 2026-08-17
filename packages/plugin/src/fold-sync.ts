import { Editor, MarkdownView } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import type MdTaskPlugin from './main';
import * as core from '@md-task/core';

/**
 * Fold API exists at runtime (verified on Obsidian 1.13.7) but is missing
 * from the published obsidian type defs — bridge with a typed extension.
 */
interface FoldableEditor extends Editor {
  getFoldOffsets(): Set<number>;
  cm?: EditorView;
}

function asFoldable(editor: Editor): FoldableEditor {
  return editor as FoldableEditor;
}

/**
 * Two-way sync between Obsidian's NATIVE fold state and the protocol's
 * trailing-▼ collapse marker (docs/interop.md, FEATURES A5).
 *
 * Design (user-directed, minimal — docs/principles.md): reuse the editor's
 * built-in fold arrows as the ONLY collapse UI; this module just keeps the
 * protocol state in step:
 *
 *   - user clicks the native fold arrow  -> ▼ is written to the file
 *   - file carries ▼ on open             -> the subtree is folded natively
 *     (via the same native fold arrow, located through the cm6 DOM)
 *
 * Mechanics (all verified on Obsidian 1.13.7):
 *   - editor.getFoldOffsets() returns a Set of CHARACTER OFFSETS marking
 *     folded region starts; editor.offsetToPos() maps them to line numbers
 *   - foldable list items expose div.collapse-indicator in their cm-line;
 *     clicking it is the native fold action
 *   - no fold-change event exists -> cheap 1s poll guarded by content hash
 *     and fold-state comparison; only task lines are ever touched (folding a
 *     heading writes no marker)
 */
export class FoldSync {
  private timer: number | undefined;
  private lastFolded: number[] = [];
  private lastDocHash = '';

  constructor(private plugin: MdTaskPlugin) {}

  start(): void {
    this.timer = window.setInterval(() => this.tick(), 1000);
    this.plugin.register(() => window.clearInterval(this.timer));
  }

  private tick(): void {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const editor = asFoldable(view.editor);
    const text = editor.getValue();

    const foldedSet = editor.getFoldOffsets();
    const folded: number[] = [];
    if (foldedSet && typeof foldedSet.size === 'number') {
      for (const off of Array.from(foldedSet as Set<number>)) {
        try {
          folded.push(editor.offsetToPos(off).line); // 0-based line
        } catch {
          /* offset outside doc — ignore */
        }
      }
      folded.sort((a, b) => a - b);
    }

    // Direction arbitration:
    //  - content changed (file opened / edited) -> markers are authoritative:
    //    fold natively whatever carries ▼ (read direction)
    //  - only fold state changed (user clicked an arrow) -> UI is
    //    authoritative: write/clear markers to match (write direction)
    const hash = core.contentHash(text);
    const foldSame =
      this.lastFolded.length === folded.length &&
      folded.every((n, i) => n === this.lastFolded[i]);
    const contentChanged = hash !== this.lastDocHash;
    if (!contentChanged && foldSame) return;

    const doc = core.parseDocument(text);
    const taskAt = new Map<number, core.Task>(); // 0-based line -> task
    const collapsed = new Set<number>(); // 0-based lines carrying ▼
    for (const t of doc.tasks) {
      taskAt.set(t.lineNumber - 1, t);
      if (t.collapsed) collapsed.add(t.lineNumber - 1);
    }
    const foldedSet2 = new Set(folded);

    if (contentChanged) {
      // Read direction: ▼ marker -> native fold.
      const toFold = [...collapsed].filter((n) => !foldedSet2.has(n) && taskAt.has(n));
      for (const n of toFold) this.foldRow(editor, n);
    } else if (!foldSame) {
      // Write direction: native fold state -> ▼ marker.
      const needMarker = folded.filter((n) => taskAt.has(n) && !collapsed.has(n));
      for (const n of needMarker) {
        const t = taskAt.get(n);
        if (t && !t.raw.endsWith(' ▼')) editor.setLine(n, t.raw + ' ▼');
      }
      const needUnmark = [...collapsed].filter((n) => !foldedSet2.has(n));
      for (const n of needUnmark) {
        const cur = editor.getLine(n);
        if (cur.endsWith(' ▼')) editor.setLine(n, cur.slice(0, -2));
      }
    }

    this.lastDocHash = hash;
    this.lastFolded = folded;
  }

  /** Click the native fold arrow of a 0-based line, if rendered. */
  private foldRow(editor: FoldableEditor, lineNo0: number): void {
    const cm = editor.cm;
    if (!cm) return;
    const line = cm.state.doc.line(lineNo0 + 1);
    let node: Node;
    try {
      node = cm.domAtPos(line.from).node;
    } catch {
      return; // line outside viewport / not rendered
    }
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
    const row = el?.closest('.cm-line');
    const arrow = row?.querySelector<HTMLElement>('.collapse-indicator');
    arrow?.click();
  }
}
