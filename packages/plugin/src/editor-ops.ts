import { Editor } from 'obsidian';
import * as core from '@md-task/core';

/** Editor primitives the plugin exposes as commands / view actions. */
export type Primitive =
  | 'toggle'
  | 'indent'
  | 'outdent'
  | 'insert'
  | 'moveUp'
  | 'moveDown'
  | 'delete'
  | 'fold'
  | 'unfold';

/**
 * Apply a core primitive to the line under the cursor (or an explicit
 * 1-based line) and update the editor with a minimal, undoable change.
 * Returns true when something changed.
 */
export function applyPrimitive(
  editor: Editor,
  p: Primitive,
  text?: string,
  lineNoOverride?: number,
): boolean {
  const cursor = editor.getCursor();
  const lineNo = lineNoOverride ?? cursor.line + 1; // 1-based
  const doc = editor.getValue();
  // Obsidian's editor normalizes to \n internally.
  const lines = doc.split('\n');

  let r: core.OpResult;
  switch (p) {
    case 'toggle':
      r = core.toggle(lines, lineNo);
      break;
    case 'indent':
      r = core.indent(lines, lineNo);
      break;
    case 'outdent':
      r = core.outdent(lines, lineNo);
      break;
    case 'insert':
      r = core.insert(lines, lineNo, text ?? '');
      break;
    case 'moveUp':
      r = core.move(lines, lineNo, 'up');
      break;
    case 'moveDown':
      r = core.move(lines, lineNo, 'down');
      break;
    case 'delete':
      r = core.deleteTask(lines, lineNo);
      break;
    case 'fold':
      r = core.setCollapsed(lines, lineNo, true);
      break;
    case 'unfold':
      r = core.setCollapsed(lines, lineNo, false);
      break;
  }
  if (!r.changed) return false;

  const idx = lineNo - 1;

  if (p === 'insert') {
    // Insert one line right after the anchor line (end-of-line splice).
    const newLine = r.lines[idx + 1] ?? '';
    editor.replaceRange('\n' + newLine, { line: idx, ch: lines[idx]?.length ?? 0 });
    return true;
  }

  // Single-line or block primitives: replace the task's physical block range.
  const block = core.blockRange(lines, idx);
  const from = { line: block.start, ch: 0 };
  const to = { line: block.end, ch: lines[block.end]?.length ?? 0 };
  const replacement = r.lines.slice(block.start, block.end + 1).join('\n');
  editor.replaceRange(replacement, from, to);
  return true;
}
