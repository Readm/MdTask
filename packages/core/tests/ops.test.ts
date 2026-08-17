import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggle, indent, outdent, insert, move, deleteTask, setCollapsed } from '../src/index.js';

const DOC = [
  '- [ ] top1',
  '  - [ ] sub1',
  '  - [ ] sub2',
  '- [ ] top2',
  'para line',
  '- [x] done ▼',
];

function apply(fn: (...args: any[]) => { lines: string[]; changed: boolean }, line: number, ...rest: any[]) {
  return fn(DOC.slice(), line, ...rest);
}

test('toggle: unchecked -> checked', () => {
  const r = apply(toggle, 1);
  assert.equal(r.changed, true);
  assert.equal(r.lines[0], '- [x] top1');
  assert.equal(r.lines[5], DOC[5]); // untouched
});

test('toggle: checked -> unchecked, keeps collapse marker', () => {
  const r = apply(toggle, 6);
  assert.equal(r.changed, true);
  assert.equal(r.lines[5], '- [ ] done ▼');
});

test('toggle: non-task line is no-op', () => {
  const r = apply(toggle, 5);
  assert.equal(r.changed, false);
  assert.deepEqual(r.lines, DOC);
});

test('indent: +2 spaces becomes subtask of previous', () => {
  const r = apply(indent, 4); // top2 -> child of sub2
  assert.equal(r.changed, true);
  assert.equal(r.lines[3], '  - [ ] top2');
});

test('indent: top-level first task is no-op', () => {
  const r = apply(indent, 1);
  assert.equal(r.changed, false);
});

test('indent: keeps collapse marker', () => {
  const r = indent(DOC.slice(), 6); // done ▼ is top-level... second task at depth 0
  assert.equal(r.lines[5], '  - [x] done ▼');
});

test('outdent: -2 spaces', () => {
  const r = apply(outdent, 2); // sub1 -> top level
  assert.equal(r.changed, true);
  assert.equal(r.lines[1], '- [ ] sub1');
});

test('outdent: already top-level is no-op', () => {
  const r = apply(outdent, 1);
  assert.equal(r.changed, false);
});

test('outdent: non-task line is no-op', () => {
  const r = apply(outdent, 5);
  assert.equal(r.changed, false);
});

test('insert: inherits indentation and marker', () => {
  const r = apply(insert, 3, 'new task');
  assert.equal(r.changed, true);
  assert.equal(r.lines[3], '  - [ ] new task');
  assert.equal(r.lines[4], DOC[3]); // original top2 shifted down untouched
});

test('insert: after non-task line is no-op', () => {
  const r = apply(insert, 5, 'x');
  assert.equal(r.changed, false);
});

test('move up: swaps whole subtree block with previous block', () => {
  // top2 block = [top2, para line]; previous task block = [sub2]
  const r = apply(move, 4, 'up');
  assert.equal(r.changed, true);
  assert.deepEqual(r.lines, [
    '- [ ] top1',
    '  - [ ] sub1',
    '- [ ] top2',
    'para line',
    '  - [ ] sub2',
    '- [x] done ▼',
  ]);
});

test('move up: at first task is no-op', () => {
  const r = apply(move, 1, 'up');
  assert.equal(r.changed, false);
});

test('move down: swaps with next block', () => {
  const r = apply(move, 1, 'down'); // top1 block = [top1, sub1, sub2]
  assert.equal(r.changed, true);
  assert.deepEqual(r.lines, [
    '- [ ] top2',
    'para line',
    '- [ ] top1',
    '  - [ ] sub1',
    '  - [ ] sub2',
    '- [x] done ▼',
  ]);
});

test('move down: at last task is no-op', () => {
  const r = apply(move, 6, 'down');
  assert.equal(r.changed, false);
});

test('deleteTask: removes whole subtree block', () => {
  const r = apply(deleteTask, 1);
  assert.equal(r.changed, true);
  assert.deepEqual(r.lines, [
    '- [ ] top2',
    'para line',
    '- [x] done ▼',
  ]);
});

test('deleteTask: non-task line is no-op', () => {
  const r = apply(deleteTask, 5);
  assert.equal(r.changed, false);
});

test('setCollapsed: adds marker on expanded task', () => {
  const r = apply(setCollapsed, 1, true);
  assert.equal(r.changed, true);
  assert.equal(r.lines[0], '- [ ] top1 ▼');
});

test('setCollapsed: removes marker on collapsed task', () => {
  const r = apply(setCollapsed, 6, false);
  assert.equal(r.changed, true);
  assert.equal(r.lines[5], '- [x] done');
});

test('setCollapsed: no-op when state matches', () => {
  assert.equal(apply(setCollapsed, 6, true).changed, false);
  assert.equal(apply(setCollapsed, 1, false).changed, false);
});

test('setCollapsed: non-task line is no-op', () => {
  const r = apply(setCollapsed, 5, true);
  assert.equal(r.changed, false);
});

test('primitives leave other content byte-identical', () => {
  const r = apply(toggle, 1);
  for (let i = 0; i < DOC.length; i++) {
    if (i !== 0) assert.equal(r.lines[i], DOC[i]);
  }
});

// --- review-recommended edge cases ---

const DEEP = [
  '- [ ] a',
  '  - [ ] a1',
  '    - [ ] a1i',
  '  - [ ] a2',
  '- [ ] b',
];

test('move down: multi-level subtree moves as one block', () => {
  // a's block = [a, a1, a1i, a2]; move down swaps with b's block [b]
  const r = move(DEEP.slice(), 1, 'down');
  assert.deepEqual(r.lines, [
    '- [ ] b',
    '- [ ] a',
    '  - [ ] a1',
    '    - [ ] a1i',
    '  - [ ] a2',
  ]);
});

test('move up: deep node physically moves above previous block', () => {
  // move a2 (with its block [a2]) above a1i's block [a1i]
  const r = move(DEEP.slice(), 4, 'up');
  assert.deepEqual(r.lines, [
    '- [ ] a',
    '  - [ ] a1',
    '  - [ ] a2',
    '    - [ ] a1i',
    '- [ ] b',
  ]);
});

test('collapse marker survives toggle/indent/outdent', () => {
  const withMark = ['- [ ] top', '  - [ ] sub ▼'];
  assert.equal(toggle(withMark.slice(), 2).lines[1], '  - [x] sub ▼');
  assert.equal(indent(withMark.slice(), 2).lines[1], '    - [ ] sub ▼');
  assert.equal(outdent(['  - [ ] sub ▼'], 1).lines[0], '- [ ] sub ▼');
});

test('collapse marker travels with moved block', () => {
  const withMark = ['- [ ] top ▼', '  - [ ] sub', '- [ ] other'];
  const r = move(withMark.slice(), 1, 'down');
  assert.deepEqual(r.lines, ['- [ ] other', '- [ ] top ▼', '  - [ ] sub']);
});

test('primitives on CRLF line arrays keep \\r intact (no-op or exact)', () => {
  // Single-line API operates on \n-split lines; a stray \r is not a task line
  // (parseTaskLine rejects it) — primitives must no-op, never corrupt it.
  // Document-level \r\n handling is covered in parser.test.ts (parseDocument
  // splits it away; joinLines restores it).
  const crlfLines = ['- [ ] foo\r', '- [ ] bar'];
  const r = toggle(crlfLines.slice(), 1);
  assert.equal(r.changed, false);
  assert.deepEqual(r.lines, crlfLines); // byte-identical, nothing corrupted
  assert.equal(indent(crlfLines.slice(), 1).changed, false);
});
