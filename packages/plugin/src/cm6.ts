import { EditorView, keymap } from '@codemirror/view';
import { Prec, Extension } from '@codemirror/state';
import * as core from '@md-task/core';

/**
 * Minimal keymap — design principle: reuse Obsidian's native capabilities
 * wherever they exist (docs/principles.md). Tab/Shift+Tab list indentation
 * and Cmd+L toggle are native; the ONLY thing we bind ourselves is
 * Ctrl+Enter (Obsidian 1.13 has no default binding for it, verified).
 *
 * Handled here (CodeMirror keymap) rather than addCommand({hotkeys}):
 * Obsidian 1.13.7 does not apply default hotkeys from the command object
 * (verified via hotkeyManager.bakedHotkeys).
 */
export function taskKeymap(): Extension {
  return Prec.high(
    keymap.of([{ key: 'Ctrl-Enter', run: (view) => handleToggle(view) }]),
  );
}

/** Ctrl+Enter toggles the checkbox of the task line under the cursor. */
function handleToggle(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  if (!core.parseTaskLine(line.text, line.number)) return false; // not a task line
  const lines = view.state.doc.toString().split('\n');
  const r = core.toggle(lines, line.number);
  if (!r.changed) return false;
  view.dispatch({ changes: { from: line.from, to: line.to, insert: r.lines[line.number - 1] ?? line.text } });
  return true;
}
