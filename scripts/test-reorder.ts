// ponytail: minimal assert-based self-check for src/lib/reorder.ts's
// queue-move math (off-by-one errors here are easy to introduce silently).
// Run: npx tsx scripts/test-reorder.ts
import assert from 'node:assert';
import { moveItem, adjustIndexAfterMove } from '../src/lib/reorder';

// moveItem
assert.deepStrictEqual(moveItem(['A', 'B', 'C', 'D', 'E'], 3, 1), ['A', 'D', 'B', 'C', 'E']);
assert.deepStrictEqual(moveItem(['A', 'B', 'C', 'D', 'E'], 0, 3), ['B', 'C', 'D', 'A', 'E']);
assert.deepStrictEqual(moveItem(['A', 'B', 'C'], 2, 0), ['C', 'A', 'B']);

// adjustIndexAfterMove — currentIndex=2 ("C" playing) in ['A','B','C','D','E']
assert.strictEqual(adjustIndexAfterMove(2, 3, 1), 3); // D moved from after to before C -> C shifts right
assert.strictEqual(adjustIndexAfterMove(2, 0, 3), 1); // A moved from before to after C -> C shifts left
assert.strictEqual(adjustIndexAfterMove(2, 2, 0), 0); // C itself moved -> tracks to new position
assert.strictEqual(adjustIndexAfterMove(2, 4, 3), 2); // move D->pos3, both after C -> C unaffected
assert.strictEqual(adjustIndexAfterMove(2, 3, 4), 2); // move D->pos4, both after C -> C unaffected

console.log('reorder.ts self-check: all assertions passed');
