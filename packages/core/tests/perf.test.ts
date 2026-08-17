import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument, toggle } from '../src/index.js';

const TARGET_MB = 10;
const LINE = '- [ ] task item with some text for perf ▼\r\n';

test('B5: parse ~10MB document under 200ms', () => {
  const count = Math.ceil((TARGET_MB * 1024 * 1024) / Buffer.byteLength(LINE));
  const doc = LINE.repeat(count);
  assert.ok(Buffer.byteLength(doc) >= TARGET_MB * 1024 * 1024, 'fixture is ~10MB');

  const t0 = performance.now();
  const d = parseDocument(doc);
  const ms = performance.now() - t0;

  assert.equal(d.tasks.length, count);
  assert.ok(ms < 200, `parse took ${ms.toFixed(1)}ms`);
});

test('B5: edit primitive on ~10MB file under 5ms', () => {
  const count = Math.ceil((TARGET_MB * 1024 * 1024) / Buffer.byteLength(LINE));
  const lines = LINE.repeat(count).split(/\r\n|\n/).slice(0, -1); // drop trailing empty
  const target = Math.floor(count / 2);

  const t0 = performance.now();
  const r = toggle(lines, target);
  const ms = performance.now() - t0;

  assert.equal(r.changed, true);
  assert.equal(r.lines[target - 1], LINE.replace('[ ]', '[x]').replace('\r\n', ''));
  assert.ok(ms < 5, `toggle took ${ms.toFixed(2)}ms`);
});
