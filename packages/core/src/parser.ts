import type { Document, Task } from './model.js';

/**
 * Task line regex — see docs/protocol.md §2.
 * Groups: 1=indent, 2=marker, 3=checkbox, 4=text, 5=collapse marker (optional).
 */
const TASK_LINE_RE = /^(\s*)([-*+])\s+\[([ xX])\]\s*(.*?)(\s?▼)?$/;

/** Parse a single line into a Task, or null if the line is not a checklist item. */
export function parseTaskLine(line: string, lineNumber: number): Task | null {
  const m = TASK_LINE_RE.exec(line);
  if (!m) return null;
  return {
    lineNumber,
    indent: m[1] ?? '',
    marker: m[2] ?? '-',
    completed: (m[3] ?? ' ') !== ' ',
    text: m[4] ?? '',
    collapsed: (m[5] ?? '') !== '',
    raw: line,
  };
}

/** Detect the document line ending: prefers CRLF when the file uses it. */
export function detectLineEnding(text: string): '\n' | '\r\n' {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Parse all checklist items in a markdown document into a Document.
 * Line-based rules only — no code-fence awareness (that is the shell layer's
 * job, see docs/protocol.md §6).
 */
export function parseDocument(text: string): Document {
  const lines = text.split(/\r\n|\n/);
  const tasks: Task[] = [];
  for (let i = 0; i < lines.length; i++) {
    const task = parseTaskLine(lines[i] ?? '', i + 1);
    if (task) tasks.push(task);
  }
  return { tasks, lineEnding: detectLineEnding(text) };
}

/** Serialize lines back to text with the document's line ending. */
export function joinLines(lines: string[], lineEnding: '\n' | '\r\n'): string {
  return lines.join(lineEnding);
}
