import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskLine, parseTasks } from '../src/index.js';
test('parseTaskLine: unchecked task', () => {
    const t = parseTaskLine('- [ ] write a test', 3);
    assert.deepEqual(t, { lineNumber: 3, completed: false, text: 'write a test', indent: '' });
});
test('parseTaskLine: checked task with [x] and [X]', () => {
    assert.equal(parseTaskLine('- [x] done', 1)?.completed, true);
    assert.equal(parseTaskLine('- [X] done', 1)?.completed, true);
});
test('parseTaskLine: indented nested task keeps indent', () => {
    const t = parseTaskLine('  - [ ] subtask', 5);
    assert.equal(t?.indent, '  ');
    assert.equal(t?.text, 'subtask');
});
test('parseTaskLine: non-task lines return null', () => {
    assert.equal(parseTaskLine('plain text', 1), null);
    assert.equal(parseTaskLine('# Heading', 1), null);
    assert.equal(parseTaskLine('- bullet without checkbox', 1), null);
    assert.equal(parseTaskLine('', 1), null);
});
test('parseTaskLine: star and plus bullets', () => {
    assert.equal(parseTaskLine('* [ ] star bullet', 1)?.text, 'star bullet');
    assert.equal(parseTaskLine('+ [ ] plus bullet', 1)?.text, 'plus bullet');
});
test('parseTasks: collects all tasks with line numbers', () => {
    const doc = '# Todo\n\n- [ ] task one\n- [x] task two\n\nplain paragraph\n- [ ] task three\n';
    const tasks = parseTasks(doc);
    assert.equal(tasks.length, 3);
    assert.deepEqual(tasks.map((t) => [t.lineNumber, t.completed, t.text]), [
        [3, false, 'task one'],
        [4, true, 'task two'],
        [7, false, 'task three'],
    ]);
});
test('parseTasks: empty document yields no tasks', () => {
    assert.deepEqual(parseTasks(''), []);
});
//# sourceMappingURL=markdown.test.js.map