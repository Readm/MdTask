/**
 * A task item parsed from a markdown checklist line.
 *
 * This is the minimal data model for the v0.1 skeleton. It will grow into the
 * full task model (due dates, priority, recurrence, statuses, etc.) when the
 * obsidian-tasks-compatible core lands — see README "Roadmap".
 */
export interface TaskItem {
  /** 1-based line number in the source document. */
  readonly lineNumber: number;
  /** Whether the checkbox is checked: `[x]` / `[X]`. */
  readonly completed: boolean;
  /** The task text following the checkbox marker. */
  readonly text: string;
  /** Leading whitespace of the line (indentation depth). */
  readonly indent: string;
}

/** Regex matching a markdown task list item. Handles `-`, `*`, `+` bullets. */
const TASK_LINE_RE = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/;

/**
 * Parse a single line into a TaskItem, or return null if the line is not a
 * checklist item.
 */
export function parseTaskLine(line: string, lineNumber: number): TaskItem | null {
  const m = TASK_LINE_RE.exec(line);
  if (!m) return null;
  return {
    lineNumber,
    completed: m[2] !== ' ',
    text: m[3] ?? '',
    indent: m[1] ?? '',
  };
}

/**
 * Parse all checklist items in a markdown document.
 * Non-task lines are skipped; line numbers refer to the original document.
 */
export function parseTasks(text: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const task = parseTaskLine(lines[i] ?? '', i + 1);
    if (task) tasks.push(task);
  }
  return tasks;
}
