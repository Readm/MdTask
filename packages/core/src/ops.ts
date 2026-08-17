import { parseTaskLine } from './parser.js';

/**
 * Edit primitives — see docs/protocol.md §5.
 * All primitives are line-level pure functions: given the full line array,
 * they return a new array where ONLY the target line(s) changed; everything
 * else is byte-identical. Primitives on non-task lines are no-ops.
 */

export interface OpResult {
  lines: string[];
  /** Whether the operation actually changed anything. */
  changed: boolean;
}

/** Length of the leading whitespace of a line. */
export function indentLength(line: string): number {
  const m = /^\s*/.exec(line);
  return m?.[0]?.length ?? 0;
}

/** Index of the task line immediately before idx (0-based), or -1. */
function prevTaskIdx(lines: string[], idx: number): number {
  for (let i = idx - 1; i >= 0; i--) {
    if (parseTaskLine(lines[i] ?? '', 0)) return i;
  }
  return -1;
}

/** Index of the task line immediately after idx (0-based), or -1. */
function nextTaskIdx(lines: string[], idx: number): number {
  for (let i = idx + 1; i < lines.length; i++) {
    if (parseTaskLine(lines[i] ?? '', 0)) return i;
  }
  return -1;
}

/**
 * Physical block of a task: the task line plus all following lines up to (but
 * excluding) the next task line whose indentation is <= the block head's.
 * Non-task lines between tasks belong to the block they follow (§3, §5).
 */
export function blockRange(lines: string[], headIdx: number): { start: number; end: number } {
  const base = indentLength(lines[headIdx] ?? '');
  let end = headIdx;
  for (let i = headIdx + 1; i < lines.length; i++) {
    const t = parseTaskLine(lines[i] ?? '', 0);
    if (t && indentLength(lines[i] ?? '') <= base) break;
    end = i;
  }
  return { start: headIdx, end };
}

/** Toggle `[ ]` <-> `[x]`. Never touches text or collapse marker. No child linking. */
export function toggle(lines: string[], line: number): OpResult {
  const idx = line - 1;
  const cur = lines[idx];
  const t = cur !== undefined ? parseTaskLine(cur, line) : null;
  if (!t) return { lines, changed: false };
  const next = t.completed ? cur!.replace(/\[[xX]\]/, '[ ]') : cur!.replace(/\[ \]/, '[x]');
  return changedAt(lines, idx, next);
}

/** Indent a task by +2 spaces (becomes a subtask of the previous task). Top-level no-op. */
export function indent(lines: string[], line: number): OpResult {
  const idx = line - 1;
  const cur = lines[idx];
  const t = cur !== undefined ? parseTaskLine(cur, line) : null;
  if (!t) return { lines, changed: false };
  if (prevTaskIdx(lines, idx) < 0) return { lines, changed: false }; // top-level: no-op
  return changedAt(lines, idx, '  ' + cur!);
}

/** Outdent a task by -2 spaces (raise level), never below 0. */
export function outdent(lines: string[], line: number): OpResult {
  const idx = line - 1;
  const cur = lines[idx];
  const t = cur !== undefined ? parseTaskLine(cur, line) : null;
  if (!t) return { lines, changed: false };
  const curIndent = indentLength(cur!);
  if (curIndent === 0) return { lines, changed: false };
  const cut = Math.min(2, curIndent);
  return changedAt(lines, idx, cur!.slice(cut));
}

/**
 * Insert a new task line after `after`, inheriting its indentation and marker.
 * Returns { lines, changed: false } if `after` is not a task line.
 */
export function insert(lines: string[], after: number, text: string): OpResult {
  const idx = after - 1;
  const t = lines[idx] !== undefined ? parseTaskLine(lines[idx]!, after) : null;
  if (!t) return { lines, changed: false };
  const marker = t.marker;
  const newLine = `${t.indent}${marker} [ ] ${text}`;
  const next = lines.slice();
  next.splice(idx + 1, 0, newLine);
  return { lines: next, changed: true };
}

/**
 * Move a task (with its whole subtree block) up/down, swapping with the
 * adjacent task block. No-op at document boundaries.
 */
export function move(lines: string[], line: number, dir: 'up' | 'down'): OpResult {
  const idx = line - 1;
  const t = lines[idx] !== undefined ? parseTaskLine(lines[idx]!, line) : null;
  if (!t) return { lines, changed: false };

  if (dir === 'up') {
    const prev = prevTaskIdx(lines, idx);
    if (prev < 0) return { lines, changed: false };
    const prevBlock = blockRange(lines, prev);
    const curBlock = blockRange(lines, idx);
    const next = lines.slice();
    const block = next.splice(curBlock.start, curBlock.end - curBlock.start + 1);
    next.splice(prevBlock.start, 0, ...block);
    return { lines: next, changed: true };
  } else {
    // The "next block" is the first task line AFTER our own block — not any
    // task line after the cursor (that would pick up a child task inside the
    // block and produce a no-op move).
    const curBlock = blockRange(lines, idx);
    const nextTask = nextTaskIdx(lines, curBlock.end);
    if (nextTask < 0) return { lines, changed: false };
    const nextBlock = blockRange(lines, nextTask);
    const next = lines.slice();
    const block = next.splice(curBlock.start, curBlock.end - curBlock.start + 1);
    next.splice(nextBlock.end - block.length + 1, 0, ...block);
    return { lines: next, changed: true };
  }
}

/** Delete a task with its whole subtree block. */
export function deleteTask(lines: string[], line: number): OpResult {
  const idx = line - 1;
  const t = lines[idx] !== undefined ? parseTaskLine(lines[idx]!, line) : null;
  if (!t) return { lines, changed: false };
  const block = blockRange(lines, idx);
  const next = lines.slice();
  next.splice(block.start, block.end - block.start + 1);
  return { lines: next, changed: true };
}

/**
 * Set (or clear) the collapse marker ` ▶` on a task line (§2.1).
 * Expanded state carries no marker; only the marker is touched.
 */
export function setCollapsed(lines: string[], line: number, collapsed: boolean): OpResult {
  const idx = line - 1;
  const cur = lines[idx];
  const t = cur !== undefined ? parseTaskLine(cur, line) : null;
  if (!t) return { lines, changed: false };
  if (t.collapsed === collapsed) return { lines, changed: false };
  const newLine = collapsed ? cur! + ' ▶' : cur!.replace(/ ▶$/, '');
  return changedAt(lines, idx, newLine);
}

function changedAt(lines: string[], idx: number, newLine: string): OpResult {
  if (lines[idx] === newLine) return { lines, changed: false };
  const next = lines.slice();
  next[idx] = newLine;
  return { lines: next, changed: true };
}
