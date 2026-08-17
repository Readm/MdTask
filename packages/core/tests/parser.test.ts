import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskLine, parseDocument, joinLines } from '../src/index.js';

test('parseTaskLine: unchecked / checked / markers', () => {
  assert.equal(parseTaskLine('- [ ] todo', 1)?.completed, false);
  assert.equal(parseTaskLine('- [x] done', 1)?.completed, true);
  assert.equal(parseTaskLine('- [X] done', 1)?.completed, true);
  assert.equal(parseTaskLine('* [ ] star', 1)?.marker, '*');
  assert.equal(parseTaskLine('+ [ ] plus', 1)?.marker, '+');
});

test('parseTaskLine: keeps indent and raw line', () => {
  const t = parseTaskLine('    - [ ] deep', 7);
  assert.equal(t?.indent, '    ');
  assert.equal(t?.raw, '    - [ ] deep');
  assert.equal(t?.lineNumber, 7);
});

test('parseTaskLine: collapse marker stripped from text', () => {
  const t = parseTaskLine('- [ ] parent ▼', 1);
  assert.equal(t?.collapsed, true);
  assert.equal(t?.text, 'parent');
});

test('parseTaskLine: no marker when absent, text kept verbatim', () => {
  const t = parseTaskLine('- [ ] parent', 1);
  assert.equal(t?.collapsed, false);
  assert.equal(t?.text, 'parent');
});

test('parseTaskLine: ▼ mid-text is NOT a collapse marker', () => {
  const t = parseTaskLine('- [ ] watch ▼ video', 1);
  assert.equal(t?.collapsed, false);
  assert.equal(t?.text, 'watch ▼ video');
});

test('parseTaskLine: multiple spaces before ▼ keep text', () => {
  const t = parseTaskLine('- [ ] foo  ▼', 1);
  assert.equal(t?.collapsed, true);
  assert.equal(t?.text, 'foo ');
});

test('parseTaskLine: non-task lines return null', () => {
  for (const line of ['plain text', '# Heading', '- bullet', '> quote', '', '```js']) {
    assert.equal(parseTaskLine(line, 1), null, `should be null: ${JSON.stringify(line)}`);
  }
});

test('parseDocument: collects tasks with original line numbers', () => {
  const doc = '# Todo\n\n- [ ] one\n- [x] two\n\npara\n- [ ] three ▼\n';
  const d = parseDocument(doc);
  assert.equal(d.lineEnding, '\n');
  assert.deepEqual(
    d.tasks.map((t) => [t.lineNumber, t.completed, t.text, t.collapsed]),
    [
      [3, false, 'one', false],
      [4, true, 'two', false],
      [7, false, 'three', true],
    ],
  );
});

test('parseDocument: CRLF document', () => {
  const d = parseDocument('- [ ] a\r\n- [ ] b\r\n');
  assert.equal(d.lineEnding, '\r\n');
  assert.equal(d.tasks.length, 2);
});

test('parseDocument: empty document', () => {
  const d = parseDocument('');
  assert.equal(d.tasks.length, 0);
  assert.equal(d.lineEnding, '\n');
});

test('joinLines: uses document line ending', () => {
  const d = parseDocument('- [ ] a\r\n- [ ] b\r\n');
  const out = joinLines(['- [ ] a', '- [ ] b'], d.lineEnding);
  assert.equal(out, '- [ ] a\r\n- [ ] b');
});
