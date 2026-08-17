import { EditorView, keymap } from '@codemirror/view';
import { Prec, Extension } from '@codemirror/state';
import * as core from '@md-task/core';

/**
 * Tab / Shift+Tab / Ctrl+Enter handling on task lines (docs/FEATURES.md C2/C3).
 * - On a task line: Tab indents (becomes a subtask of the previous task),
 *   Shift+Tab outdents (raises level), Ctrl+Enter toggles the checkbox.
 *   All via core primitives, undoable.
 * - On any other line: returns false, letting Obsidian's default behaviour run.
 *
 * Ctrl+Enter is handled here (CodeMirror keymap) rather than via
 * addCommand({hotkeys}): Obsidian 1.13.7 does not register default hotkeys
 * from the command object (verified via hotkeyManager.bakedHotkeys), so the
 * keymap path is the reliable one. The command itself still exists for the
 * command palette and user-assigned hotkeys.
 */
export function taskIndentExtension(): Extension {
  return Prec.high(
    keymap.of([
      { key: 'Tab', run: (view) => handleTab(view, 'indent') },
      { key: 'Shift-Tab', run: (view) => handleTab(view, 'outdent') },
      { key: 'Ctrl-Enter', run: (view) => handleToggle(view) },
    ]),
  );
}

function handleTab(view: EditorView, kind: 'indent' | 'outdent'): boolean {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  const task = core.parseTaskLine(line.text, line.number);
  if (!task) return false; // not a task line: default behaviour

  const lines = view.state.doc.toString().split('\n');
  const r = kind === 'indent' ? core.indent(lines, line.number) : core.outdent(lines, line.number);
  if (!r.changed) return false;

  const newLine = r.lines[line.number - 1] ?? line.text;
  const offset = Math.min(pos - line.from, newLine.length);
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newLine },
    selection: { anchor: line.from + offset },
  });
  return true;
}

/** Mod+Enter toggles the checkbox of the task line under the cursor. */
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
