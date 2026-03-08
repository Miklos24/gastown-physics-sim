import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ELEMENTS, PALETTE, EMPTY, SAND, WATER, BEHAVIOR } from '../js/elements.js';

describe('elements', () => {
  it('every element has required fields', () => {
    for (const [id, el] of Object.entries(ELEMENTS)) {
      assert.ok(el.name, `element ${id} missing name`);
      assert.ok(el.behavior, `element ${id} missing behavior`);
      assert.ok(Array.isArray(el.color) && el.color.length === 3, `element ${id} bad color`);
      assert.ok(typeof el.density === 'number', `element ${id} missing density`);
    }
  });

  it('EMPTY has NONE behavior', () => {
    assert.equal(ELEMENTS[EMPTY].behavior, BEHAVIOR.NONE);
  });

  it('PALETTE contains no duplicates', () => {
    const set = new Set(PALETTE);
    assert.equal(set.size, PALETTE.length);
  });

  it('PALETTE does not include EMPTY', () => {
    assert.ok(!PALETTE.includes(EMPTY));
  });

  it('all PALETTE elements exist in ELEMENTS', () => {
    for (const id of PALETTE) {
      assert.ok(ELEMENTS[id], `palette element ${id} not in ELEMENTS`);
    }
  });
});
