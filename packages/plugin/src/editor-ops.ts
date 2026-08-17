import { Editor } from 'obsidian';
import * as core from '@md-task/core';

/**
 * Toggle the checkbox of the line under the cursor (or an explicit 1-based
 * line) via the core primitive, with a minimal undoable editor change.
 * Everything else (indent, move, delete, ...) is left to Obsidian's native
 * capabilities — see docs/principles.md.
 */
export function toggleCheckbox(editor: Editor, lineNoOverride?: number): boolean {
  const cursor = editor.getCursor();
  const lineNo = lineNoOverride ?? cursor.line + 1; // 1-based
  const doc = editor.getValue();
  const lines = doc.split('\n');
  const r = core.toggle(lines, lineNo);
  if (!r.changed) return false;
  const idx = lineNo - 1;
  const from = { line: idx, ch: 0 };
  const to = { line: idx, ch: lines[idx]?.length ?? 0 };
  editor.replaceRange(r.lines[idx] ?? '', from, to);
  return true;
}
