# Powder Sim Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based particle physics sandbox with 15 elements, complex reactions, and responsive dark UI.

**Architecture:** Three-layer vanilla JS app — simulation engine (double-buffered grid), ImageData canvas renderer, HTML/CSS UI overlay. ES modules throughout, testable in Node via `node --test`. No build step.

**Tech Stack:** Vanilla HTML5 Canvas, CSS, JavaScript (ES modules), Node built-in test runner.

**Design doc:** `docs/plans/2026-03-08-powder-sim-design.md`

---

### Task 1: Project Scaffolding + Element Definitions

**Files:**
- Create: `js/elements.js`
- Create: `tests/elements.test.js`

**Step 1: Write element definitions**

`js/elements.js` — defines all 15 elements + Empty + Fire as data:

```js
// Element type constants
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const STONE = 3;
export const FIRE = 4;
export const OIL = 5;
export const STEAM = 6;
export const WOOD = 7;
export const GUNPOWDER = 8;
export const ICE = 9;
export const LAVA = 10;
export const METAL = 11;
export const ACID = 12;
export const PLANT = 13;
export const SALT = 14;
export const SMOKE = 15;
export const GLASS = 16;
export const ASH = 17;
export const SALTWATER = 18;

// Behavior categories
export const BEHAVIOR = {
  NONE: 'none',       // Empty
  POWDER: 'powder',   // Falls, piles, slides
  LIQUID: 'liquid',   // Flows sideways, density-based
  GAS: 'gas',         // Rises, disperses
  SOLID: 'solid',     // Static unless acted on
  FIRE: 'fire',       // Special: burns, spreads, dies
  ORGANIC: 'organic', // Grows, burns
};

// Element metadata
export const ELEMENTS = {
  [EMPTY]:     { name: 'Empty',     behavior: BEHAVIOR.NONE,    color: [0, 0, 0],       density: 0 },
  [SAND]:      { name: 'Sand',      behavior: BEHAVIOR.POWDER,  color: [194, 178, 128],  density: 1500 },
  [WATER]:     { name: 'Water',     behavior: BEHAVIOR.LIQUID,  color: [28, 119, 195],   density: 1000 },
  [STONE]:     { name: 'Stone',     behavior: BEHAVIOR.SOLID,   color: [136, 140, 141],  density: 2500 },
  [FIRE]:      { name: 'Fire',      behavior: BEHAVIOR.FIRE,    color: [226, 88, 34],    density: 0,    lifetime: 30 },
  [OIL]:       { name: 'Oil',       behavior: BEHAVIOR.LIQUID,  color: [64, 48, 28],     density: 800 },
  [STEAM]:     { name: 'Steam',     behavior: BEHAVIOR.GAS,     color: [200, 200, 220],  density: 1,    lifetime: 200 },
  [WOOD]:      { name: 'Wood',      behavior: BEHAVIOR.SOLID,   color: [120, 81, 45],    density: 600 },
  [GUNPOWDER]: { name: 'Gunpowder', behavior: BEHAVIOR.POWDER,  color: [80, 80, 80],     density: 1700 },
  [ICE]:       { name: 'Ice',       behavior: BEHAVIOR.SOLID,   color: [150, 210, 240],  density: 900 },
  [LAVA]:      { name: 'Lava',      behavior: BEHAVIOR.LIQUID,  color: [207, 47, 14],    density: 3000 },
  [METAL]:     { name: 'Metal',     behavior: BEHAVIOR.SOLID,   color: [160, 170, 180],  density: 7800 },
  [ACID]:      { name: 'Acid',      behavior: BEHAVIOR.LIQUID,  color: [130, 255, 50],   density: 1200 },
  [PLANT]:     { name: 'Plant',     behavior: BEHAVIOR.ORGANIC, color: [34, 139, 34],    density: 500 },
  [SALT]:      { name: 'Salt',      behavior: BEHAVIOR.POWDER,  color: [230, 230, 230],  density: 2200 },
  [SMOKE]:     { name: 'Smoke',     behavior: BEHAVIOR.GAS,     color: [100, 100, 100],  density: 1,    lifetime: 150 },
  [GLASS]:     { name: 'Glass',     behavior: BEHAVIOR.SOLID,   color: [200, 220, 255],  density: 2500 },
  [ASH]:       { name: 'Ash',       behavior: BEHAVIOR.POWDER,  color: [150, 150, 150],  density: 600 },
  [SALTWATER]: { name: 'Saltwater', behavior: BEHAVIOR.LIQUID,  color: [40, 130, 180],   density: 1025 },
};

// Palette: elements the player can select (excludes byproducts like Ash, Saltwater)
export const PALETTE = [
  SAND, WATER, STONE, FIRE, OIL, STEAM, WOOD,
  GUNPOWDER, ICE, LAVA, METAL, ACID, PLANT, SALT, GLASS, SMOKE,
];
```

**Step 2: Write tests for element definitions**

`tests/elements.test.js`:

```js
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
```

**Step 3: Run tests**

Run: `node --test tests/elements.test.js`
Expected: All pass.

**Step 4: Commit**

```bash
git add js/elements.js tests/elements.test.js
git commit -m "feat: add element definitions and palette"
```

---

### Task 2: Grid Core

**Files:**
- Create: `js/grid.js`
- Create: `tests/grid.test.js`

**Step 1: Write tests for grid**

`tests/grid.test.js`:

```js
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Grid } from '../js/grid.js';
import { EMPTY, SAND, WATER } from '../js/elements.js';

describe('Grid', () => {
  it('initializes with correct dimensions', () => {
    const g = new Grid(10, 5);
    assert.equal(g.width, 10);
    assert.equal(g.height, 5);
  });

  it('all cells start as EMPTY', () => {
    const g = new Grid(3, 3);
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++)
        assert.equal(g.get(x, y), EMPTY);
  });

  it('set and get work', () => {
    const g = new Grid(5, 5);
    g.set(2, 3, SAND);
    assert.equal(g.get(2, 3), SAND);
  });

  it('out of bounds returns -1', () => {
    const g = new Grid(5, 5);
    assert.equal(g.get(-1, 0), -1);
    assert.equal(g.get(5, 0), -1);
    assert.equal(g.get(0, -1), -1);
    assert.equal(g.get(0, 5), -1);
  });

  it('swap exchanges two cells', () => {
    const g = new Grid(5, 5);
    g.set(0, 0, SAND);
    g.set(1, 1, WATER);
    g.swap(0, 0, 1, 1);
    assert.equal(g.get(0, 0), WATER);
    assert.equal(g.get(1, 1), SAND);
  });

  it('inBounds checks correctly', () => {
    const g = new Grid(10, 10);
    assert.ok(g.inBounds(0, 0));
    assert.ok(g.inBounds(9, 9));
    assert.ok(!g.inBounds(-1, 0));
    assert.ok(!g.inBounds(10, 0));
  });

  it('clear resets all cells to EMPTY', () => {
    const g = new Grid(3, 3);
    g.set(1, 1, SAND);
    g.clear();
    assert.equal(g.get(1, 1), EMPTY);
  });
});
```

**Step 2: Implement Grid class**

`js/grid.js`:

```js
import { EMPTY } from './elements.js';

export class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // Main cell type array
    this.cells = new Uint8Array(width * height);
    // Per-cell metadata: lifetime counters, flags
    this.meta = new Float32Array(width * height);
    // Track which cells were updated this tick (prevents double-processing)
    this.updated = new Uint8Array(width * height);
  }

  _idx(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return -1;
    return this.cells[this._idx(x, y)];
  }

  set(x, y, type) {
    if (!this.inBounds(x, y)) return;
    this.cells[this._idx(x, y)] = type;
  }

  getMeta(x, y) {
    if (!this.inBounds(x, y)) return 0;
    return this.meta[this._idx(x, y)];
  }

  setMeta(x, y, val) {
    if (!this.inBounds(x, y)) return;
    this.meta[this._idx(x, y)] = val;
  }

  swap(x1, y1, x2, y2) {
    if (!this.inBounds(x1, y1) || !this.inBounds(x2, y2)) return;
    const i1 = this._idx(x1, y1);
    const i2 = this._idx(x2, y2);
    // Swap cell types
    const tmp = this.cells[i1];
    this.cells[i1] = this.cells[i2];
    this.cells[i2] = tmp;
    // Swap metadata
    const tmpM = this.meta[i1];
    this.meta[i1] = this.meta[i2];
    this.meta[i2] = tmpM;
  }

  markUpdated(x, y) {
    if (!this.inBounds(x, y)) return;
    this.updated[this._idx(x, y)] = 1;
  }

  isUpdated(x, y) {
    if (!this.inBounds(x, y)) return true;
    return this.updated[this._idx(x, y)] === 1;
  }

  clearUpdated() {
    this.updated.fill(0);
  }

  clear() {
    this.cells.fill(EMPTY);
    this.meta.fill(0);
    this.updated.fill(0);
  }
}
```

**Step 3: Run tests**

Run: `node --test tests/grid.test.js`
Expected: All pass.

**Step 4: Commit**

```bash
git add js/grid.js tests/grid.test.js
git commit -m "feat: add Grid class with cell storage, swap, and metadata"
```

---

### Task 3: Simulation Engine — Core Loop + Powder Physics

**Files:**
- Create: `js/simulation.js`
- Create: `tests/simulation.test.js`

**Step 1: Write tests for simulation**

`tests/simulation.test.js`:

```js
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Simulation } from '../js/simulation.js';
import { EMPTY, SAND, WATER, STONE } from '../js/elements.js';

describe('Simulation', () => {
  it('sand falls down into empty space', () => {
    const sim = new Simulation(5, 5);
    sim.grid.set(2, 1, SAND);
    sim.tick();
    assert.equal(sim.grid.get(2, 1), EMPTY);
    assert.equal(sim.grid.get(2, 2), SAND);
  });

  it('sand stops on bottom edge', () => {
    const sim = new Simulation(5, 5);
    sim.grid.set(2, 4, SAND);
    sim.tick();
    assert.equal(sim.grid.get(2, 4), SAND);
  });

  it('sand stops on top of stone', () => {
    const sim = new Simulation(5, 5);
    sim.grid.set(2, 2, SAND);
    sim.grid.set(2, 3, STONE);
    sim.tick();
    assert.equal(sim.grid.get(2, 2), SAND); // can't fall
  });

  it('sand slides diagonally when blocked below', () => {
    const sim = new Simulation(5, 5);
    sim.grid.set(2, 2, SAND);
    sim.grid.set(2, 3, STONE);
    // Leave 1,3 and 3,3 open — sand should slide to one of them
    sim.tick();
    const wentLeft = sim.grid.get(1, 3) === SAND;
    const wentRight = sim.grid.get(3, 3) === SAND;
    assert.ok(wentLeft || wentRight, 'sand should slide diagonally');
  });

  it('sand stacks and does not overlap', () => {
    const sim = new Simulation(3, 5);
    sim.grid.set(1, 0, SAND);
    sim.grid.set(1, 1, SAND);
    // Tick enough for both to settle
    for (let i = 0; i < 10; i++) sim.tick();
    // Both should exist, one on bottom, one on top
    assert.equal(sim.grid.get(1, 4), SAND);
    assert.equal(sim.grid.get(1, 3), SAND);
  });
});
```

**Step 2: Implement Simulation class with powder physics**

`js/simulation.js`:

```js
import { Grid } from './grid.js';
import {
  EMPTY, ELEMENTS, BEHAVIOR,
  SAND, WATER, STONE, FIRE, OIL, STEAM, WOOD, GUNPOWDER,
  ICE, LAVA, METAL, ACID, PLANT, SALT, SMOKE, GLASS, ASH, SALTWATER,
} from './elements.js';

export class Simulation {
  constructor(width, height) {
    this.grid = new Grid(width, height);
    this.tickCount = 0;
  }

  tick() {
    const { grid } = this;
    grid.clearUpdated();

    // Process bottom-to-top so gravity works in one pass
    for (let y = grid.height - 1; y >= 0; y--) {
      // Randomize x-order per row to avoid directional bias
      const leftToRight = Math.random() < 0.5;
      for (let i = 0; i < grid.width; i++) {
        const x = leftToRight ? i : grid.width - 1 - i;

        if (grid.isUpdated(x, y)) continue;

        const type = grid.get(x, y);
        if (type === EMPTY) continue;

        const el = ELEMENTS[type];
        if (!el) continue;

        switch (el.behavior) {
          case BEHAVIOR.POWDER:
            this._updatePowder(x, y, type);
            break;
          case BEHAVIOR.LIQUID:
            this._updateLiquid(x, y, type);
            break;
          case BEHAVIOR.GAS:
            this._updateGas(x, y, type);
            break;
          case BEHAVIOR.FIRE:
            this._updateFire(x, y, type);
            break;
          case BEHAVIOR.ORGANIC:
            this._updateOrganic(x, y, type);
            break;
          case BEHAVIOR.SOLID:
            this._updateSolid(x, y, type);
            break;
        }
      }
    }

    this.tickCount++;
  }

  // --- Powder: falls, slides diagonally ---
  _updatePowder(x, y, type) {
    const { grid } = this;
    const below = grid.get(x, y + 1);

    // Fall into empty
    if (below === EMPTY) {
      grid.swap(x, y, x, y + 1);
      grid.markUpdated(x, y + 1);
      return;
    }

    // Fall into lighter liquid (powder sinks through liquid)
    if (below !== -1 && below !== EMPTY) {
      const belowEl = ELEMENTS[below];
      if (belowEl && belowEl.behavior === BEHAVIOR.LIQUID &&
          ELEMENTS[type].density > belowEl.density) {
        grid.swap(x, y, x, y + 1);
        grid.markUpdated(x, y + 1);
        return;
      }
    }

    // Slide diagonally
    const dir = Math.random() < 0.5 ? -1 : 1;
    const diagA = grid.get(x + dir, y + 1);
    const diagB = grid.get(x - dir, y + 1);

    if (diagA === EMPTY) {
      grid.swap(x, y, x + dir, y + 1);
      grid.markUpdated(x + dir, y + 1);
    } else if (diagB === EMPTY) {
      grid.swap(x, y, x - dir, y + 1);
      grid.markUpdated(x - dir, y + 1);
    }
  }

  // --- Liquid: falls, flows sideways, density layering ---
  _updateLiquid(x, y, type) {
    const { grid } = this;
    const below = grid.get(x, y + 1);

    // Fall into empty
    if (below === EMPTY) {
      grid.swap(x, y, x, y + 1);
      grid.markUpdated(x, y + 1);
      return;
    }

    // Sink below lighter liquids
    if (below !== -1 && below !== EMPTY) {
      const belowEl = ELEMENTS[below];
      if (belowEl && belowEl.behavior === BEHAVIOR.LIQUID &&
          ELEMENTS[type].density > belowEl.density) {
        grid.swap(x, y, x, y + 1);
        grid.markUpdated(x, y + 1);
        return;
      }
    }

    // Diagonal flow
    const dir = Math.random() < 0.5 ? -1 : 1;
    const diagA = grid.get(x + dir, y + 1);
    const diagB = grid.get(x - dir, y + 1);
    if (diagA === EMPTY) {
      grid.swap(x, y, x + dir, y + 1);
      grid.markUpdated(x + dir, y + 1);
      return;
    }
    if (diagB === EMPTY) {
      grid.swap(x, y, x - dir, y + 1);
      grid.markUpdated(x - dir, y + 1);
      return;
    }

    // Horizontal flow
    const sideA = grid.get(x + dir, y);
    const sideB = grid.get(x - dir, y);
    if (sideA === EMPTY) {
      grid.swap(x, y, x + dir, y);
      grid.markUpdated(x + dir, y);
    } else if (sideB === EMPTY) {
      grid.swap(x, y, x - dir, y);
      grid.markUpdated(x - dir, y);
    }
  }

  // --- Gas: rises, disperses, dissipates ---
  _updateGas(x, y, type) {
    const { grid } = this;

    // Lifetime decay
    const life = grid.getMeta(x, y);
    const maxLife = ELEMENTS[type].lifetime || 200;
    if (life >= maxLife) {
      // Steam condenses to water, smoke just disappears
      if (type === STEAM) {
        grid.set(x, y, WATER);
        grid.setMeta(x, y, 0);
      } else {
        grid.set(x, y, EMPTY);
        grid.setMeta(x, y, 0);
      }
      return;
    }
    grid.setMeta(x, y, life + 1);

    // Rise
    const above = grid.get(x, y - 1);
    if (above === EMPTY) {
      grid.swap(x, y, x, y - 1);
      grid.markUpdated(x, y - 1);
      return;
    }

    // Displace heavier liquids upward
    if (above !== -1 && above !== EMPTY) {
      const aboveEl = ELEMENTS[above];
      if (aboveEl && (aboveEl.behavior === BEHAVIOR.LIQUID || aboveEl.behavior === BEHAVIOR.POWDER)) {
        grid.swap(x, y, x, y - 1);
        grid.markUpdated(x, y - 1);
        return;
      }
    }

    // Disperse diagonally up
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (grid.get(x + dir, y - 1) === EMPTY) {
      grid.swap(x, y, x + dir, y - 1);
      grid.markUpdated(x + dir, y - 1);
      return;
    }
    if (grid.get(x - dir, y - 1) === EMPTY) {
      grid.swap(x, y, x - dir, y - 1);
      grid.markUpdated(x - dir, y - 1);
      return;
    }

    // Drift horizontally
    if (grid.get(x + dir, y) === EMPTY) {
      grid.swap(x, y, x + dir, y);
      grid.markUpdated(x + dir, y);
    }
  }

  // --- Fire: burns, spreads, dies ---
  _updateFire(x, y, _type) {
    const { grid } = this;

    const life = grid.getMeta(x, y);
    if (life >= (ELEMENTS[FIRE].lifetime || 30)) {
      grid.set(x, y, EMPTY);
      grid.setMeta(x, y, 0);
      return;
    }
    grid.setMeta(x, y, life + 1);

    // Check all 8 neighbors for reactions
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        const neighbor = grid.get(nx, ny);
        if (neighbor === -1) continue;

        this._fireInteract(nx, ny, neighbor);
      }
    }

    // Fire rises slightly (like a gas, but short-lived)
    if (Math.random() < 0.3 && grid.get(x, y - 1) === EMPTY) {
      grid.swap(x, y, x, y - 1);
      grid.markUpdated(x, y - 1);
    }
  }

  _fireInteract(nx, ny, neighbor) {
    const { grid } = this;
    switch (neighbor) {
      case WOOD:
        if (Math.random() < 0.02) {
          grid.set(nx, ny, FIRE);
          grid.setMeta(nx, ny, 0);
        }
        break;
      case PLANT:
        if (Math.random() < 0.05) {
          grid.set(nx, ny, FIRE);
          grid.setMeta(nx, ny, 0);
        }
        break;
      case OIL:
        if (Math.random() < 0.15) {
          grid.set(nx, ny, FIRE);
          grid.setMeta(nx, ny, 0);
        }
        break;
      case GUNPOWDER:
        if (Math.random() < 0.8) {
          this._explode(nx, ny, 4);
        }
        break;
      case ICE:
        if (Math.random() < 0.05) {
          grid.set(nx, ny, WATER);
          grid.setMeta(nx, ny, 0);
        }
        break;
    }
  }

  _explode(cx, cy, radius) {
    const { grid } = this;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (!grid.inBounds(nx, ny)) continue;
        const cell = grid.get(nx, ny);
        if (cell === STONE || cell === METAL || cell === GLASS) continue;
        if (Math.random() < 0.7) {
          grid.set(nx, ny, Math.random() < 0.3 ? FIRE : EMPTY);
          grid.setMeta(nx, ny, 0);
        }
      }
    }
  }

  // --- Solid: static, but handles reactions ---
  _updateSolid(x, y, type) {
    // Ice freezes adjacent water slowly
    if (type === ICE) {
      if (Math.random() < 0.005) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (this.grid.get(x + dx, y + dy) === WATER) {
              this.grid.set(x + dx, y + dy, ICE);
              return;
            }
          }
        }
      }
    }
    // Other solids: no update needed
  }

  // --- Organic: plant grows near water, burns ---
  _updateOrganic(x, y, _type) {
    const { grid } = this;
    if (Math.random() < 0.01) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = grid.get(x + dx, y + dy);
          if (neighbor === WATER) {
            // Grow into a random adjacent empty cell
            const growDirs = [];
            for (let gy = -1; gy <= 1; gy++) {
              for (let gx = -1; gx <= 1; gx++) {
                if (gx === 0 && gy === 0) continue;
                if (grid.get(x + gx, y + gy) === EMPTY) {
                  growDirs.push([x + gx, y + gy]);
                }
              }
            }
            if (growDirs.length > 0) {
              const [gx, gy] = growDirs[Math.floor(Math.random() * growDirs.length)];
              grid.set(gx, gy, PLANT);
            }
            return;
          }
        }
      }
    }
  }

  // Called from liquid update — handles acid and lava reactions
  _liquidInteractions(x, y, type) {
    const { grid } = this;

    if (type === ACID) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = grid.get(x + dx, y + dy);
          if (neighbor === METAL || neighbor === STONE || neighbor === WOOD) {
            if (Math.random() < 0.03) {
              grid.set(x + dx, y + dy, EMPTY);
              grid.set(x, y, EMPTY);
              grid.setMeta(x, y, 0);
              return true;
            }
          }
        }
      }
    }

    if (type === LAVA) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = grid.get(x + dx, y + dy);
          if (neighbor === WATER || neighbor === SALTWATER) {
            grid.set(x + dx, y + dy, STEAM);
            grid.setMeta(x + dx, y + dy, 0);
            grid.set(x, y, STONE);
            grid.setMeta(x, y, 0);
            return true;
          }
          if (neighbor === ICE) {
            grid.set(x + dx, y + dy, WATER);
            grid.set(x, y, STONE);
            grid.setMeta(x, y, 0);
            return true;
          }
          if (neighbor === WOOD || neighbor === PLANT) {
            if (Math.random() < 0.1) {
              grid.set(x + dx, y + dy, FIRE);
              grid.setMeta(x + dx, y + dy, 0);
            }
          }
        }
      }
    }

    if (type === WATER) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = grid.get(x + dx, y + dy);
          if (neighbor === SALT) {
            if (Math.random() < 0.05) {
              grid.set(x + dx, y + dy, EMPTY);
              grid.set(x, y, SALTWATER);
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}
```

**Important:** The `_updateLiquid` method needs to call `_liquidInteractions` before movement. Add this as the first line of `_updateLiquid`:

```js
if (this._liquidInteractions(x, y, type)) return;
```

**Step 3: Run tests**

Run: `node --test tests/simulation.test.js`
Expected: All pass.

**Step 4: Commit**

```bash
git add js/simulation.js tests/simulation.test.js
git commit -m "feat: add simulation engine with powder, liquid, gas, fire, and solid physics"
```

---

### Task 4: Renderer

**Files:**
- Create: `js/renderer.js`

No unit tests — this is pure canvas rendering, verified visually.

**Step 1: Implement renderer**

`js/renderer.js`:

```js
import { ELEMENTS, EMPTY, FIRE, LAVA } from './elements.js';

export class Renderer {
  constructor(canvas, grid, cellSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    this.cellSize = cellSize;

    // ImageData buffer at 1:1 with grid (one pixel per cell)
    this.imageData = this.ctx.createImageData(grid.width, grid.height);
    this.buf = this.imageData.data;

    // Canvas size = grid size (CSS scales it up)
    canvas.width = grid.width;
    canvas.height = grid.height;
    canvas.style.imageRendering = 'pixelated';

    // Disable smoothing for crisp pixels
    this.ctx.imageSmoothingEnabled = false;
  }

  render() {
    const { grid, buf } = this;
    const len = grid.width * grid.height;

    for (let i = 0; i < len; i++) {
      const type = grid.cells[i];
      const pi = i * 4;

      if (type === EMPTY) {
        buf[pi] = 0;
        buf[pi + 1] = 0;
        buf[pi + 2] = 0;
        buf[pi + 3] = 255;
        continue;
      }

      const el = ELEMENTS[type];
      let [r, g, b] = el.color;

      // Add slight color variation for visual texture
      const variation = ((i * 7 + grid.cells[i] * 13) % 21) - 10;
      r = Math.max(0, Math.min(255, r + variation));
      g = Math.max(0, Math.min(255, g + variation));
      b = Math.max(0, Math.min(255, b + variation));

      // Fire and lava flicker
      if (type === FIRE || type === LAVA) {
        const flicker = Math.random() * 40 - 20;
        r = Math.max(0, Math.min(255, r + flicker));
        g = Math.max(0, Math.min(255, g + flicker * 0.5));
      }

      buf[pi] = r;
      buf[pi + 1] = g;
      buf[pi + 2] = b;
      buf[pi + 3] = 255;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  resize(width, height) {
    this.grid = null; // Will be set by main when grid is recreated
    this.imageData = this.ctx.createImageData(width, height);
    this.buf = this.imageData.data;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }
}
```

**Step 2: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add canvas renderer with ImageData buffer and pixel variation"
```

---

### Task 5: Input Handling

**Files:**
- Create: `js/input.js`

**Step 1: Implement input handler**

`js/input.js`:

```js
import { EMPTY } from './elements.js';

export class InputHandler {
  constructor(canvas, grid, cellSize) {
    this.canvas = canvas;
    this.grid = grid;
    this.cellSize = cellSize;
    this.selectedElement = EMPTY;
    this.brushSize = 2; // radius in cells
    this.isDrawing = false;
    this.lastX = -1;
    this.lastY = -1;

    this._onChangeCallbacks = [];

    this._bindEvents();
  }

  onChange(cb) {
    this._onChangeCallbacks.push(cb);
  }

  _notify() {
    for (const cb of this._onChangeCallbacks) cb();
  }

  setElement(type) {
    this.selectedElement = type;
    this._notify();
  }

  setBrushSize(size) {
    this.brushSize = size;
    this._notify();
  }

  _bindEvents() {
    const c = this.canvas;

    // Mouse
    c.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      this._draw(e);
    });
    c.addEventListener('mousemove', (e) => {
      if (this.isDrawing) this._draw(e);
    });
    c.addEventListener('mouseup', () => { this.isDrawing = false; this.lastX = -1; this.lastY = -1; });
    c.addEventListener('mouseleave', () => { this.isDrawing = false; this.lastX = -1; this.lastY = -1; });

    // Touch
    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDrawing = true;
      this._drawTouch(e);
    }, { passive: false });
    c.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.isDrawing) this._drawTouch(e);
    }, { passive: false });
    c.addEventListener('touchend', () => { this.isDrawing = false; this.lastX = -1; this.lastY = -1; });
    c.addEventListener('touchcancel', () => { this.isDrawing = false; this.lastX = -1; this.lastY = -1; });
  }

  _getGridPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.grid.width / rect.width;
    const scaleY = this.grid.height / rect.height;
    const gx = Math.floor((clientX - rect.left) * scaleX);
    const gy = Math.floor((clientY - rect.top) * scaleY);
    return [gx, gy];
  }

  _draw(e) {
    const [gx, gy] = this._getGridPos(e.clientX, e.clientY);
    this._paint(gx, gy);
  }

  _drawTouch(e) {
    const touch = e.touches[0];
    const [gx, gy] = this._getGridPos(touch.clientX, touch.clientY);
    this._paint(gx, gy);
  }

  _paint(gx, gy) {
    // Interpolate between last and current position for smooth lines
    if (this.lastX >= 0 && this.lastY >= 0) {
      const dx = gx - this.lastX;
      const dy = gy - this.lastY;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const ix = Math.round(this.lastX + dx * t);
        const iy = Math.round(this.lastY + dy * t);
        this._paintCircle(ix, iy);
      }
    } else {
      this._paintCircle(gx, gy);
    }
    this.lastX = gx;
    this.lastY = gy;
  }

  _paintCircle(cx, cy) {
    const r = this.brushSize;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (!this.grid.inBounds(x, y)) continue;

        // Only place into empty cells (don't overwrite existing elements)
        // Exception: eraser (EMPTY) always works
        if (this.selectedElement === EMPTY || this.grid.get(x, y) === EMPTY) {
          // Add slight randomness to avoid perfect circles looking artificial
          if (this.selectedElement !== EMPTY && Math.random() < 0.15) continue;
          this.grid.set(x, y, this.selectedElement);
        }
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add js/input.js
git commit -m "feat: add input handler with mouse/touch drawing and brush interpolation"
```

---

### Task 6: UI — HTML Shell + Styles

**Files:**
- Create: `index.html`
- Create: `css/style.css`

**Step 1: Write HTML**

`index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Powder Sim</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <aside id="sidebar">
      <h1 class="logo">Powder</h1>

      <section class="panel">
        <h2>Elements</h2>
        <div id="element-palette" class="palette"></div>
      </section>

      <section class="panel">
        <h2>Brush</h2>
        <input type="range" id="brush-slider" min="1" max="8" value="2">
        <span id="brush-label">2</span>
      </section>

      <section class="panel">
        <h2>Speed</h2>
        <div class="btn-group" id="speed-controls">
          <button data-speed="0.5">0.5x</button>
          <button data-speed="1" class="active">1x</button>
          <button data-speed="2">2x</button>
        </div>
      </section>

      <section class="panel controls">
        <button id="btn-pause">Pause</button>
        <button id="btn-clear">Clear</button>
      </section>
    </aside>

    <main id="canvas-container">
      <canvas id="sim-canvas"></canvas>
    </main>

    <!-- Mobile bottom bar -->
    <nav id="mobile-bar">
      <button id="mob-element" class="mob-swatch" title="Select element"></button>
      <div class="mob-brush-sizes" id="mob-brush-sizes">
        <button data-size="1" class="mob-size">S</button>
        <button data-size="3" class="mob-size active">M</button>
        <button data-size="6" class="mob-size">L</button>
      </div>
      <button id="mob-pause" class="mob-btn" title="Pause">⏸</button>
      <button id="mob-clear" class="mob-btn" title="Clear">✕</button>
    </nav>

    <!-- Mobile element picker (expandable) -->
    <div id="mobile-picker" class="hidden">
      <div id="mobile-palette" class="palette"></div>
    </div>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 2: Write CSS**

`css/style.css`:

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #111;
  --chrome: #1a1a1a;
  --border: #333;
  --text: #ccc;
  --text-dim: #888;
  --accent: #fff;
}

html, body {
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
}

#app {
  display: flex;
  height: 100%;
  width: 100%;
}

/* --- Sidebar (desktop) --- */
#sidebar {
  width: 200px;
  background: var(--chrome);
  border-right: 1px solid var(--border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.panel h2 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 8px;
}

/* Element palette grid */
.palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.swatch {
  aspect-ratio: 1;
  border: 2px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
}

.swatch:hover {
  border-color: #555;
}

.swatch.selected {
  border-color: var(--accent);
  box-shadow: 0 0 6px rgba(255,255,255,0.2);
}

.swatch-label {
  position: absolute;
  bottom: 1px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 8px;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  pointer-events: none;
}

/* Brush slider */
#brush-slider {
  width: 100%;
  accent-color: var(--accent);
}

#brush-label {
  color: var(--text-dim);
  font-size: 12px;
}

/* Button group */
.btn-group {
  display: flex;
  gap: 4px;
}

.btn-group button, .controls button {
  flex: 1;
  padding: 6px 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s, border-color 0.15s;
}

.btn-group button:hover, .controls button:hover {
  background: #222;
}

.btn-group button.active {
  background: #333;
  border-color: var(--accent);
  color: var(--accent);
}

.controls {
  display: flex;
  gap: 4px;
}

/* --- Canvas --- */
#canvas-container {
  flex: 1;
  display: flex;
  background: #000;
  overflow: hidden;
}

#sim-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* --- Mobile bar (bottom) --- */
#mobile-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--chrome);
  border-top: 1px solid var(--border);
  padding: 0 12px;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.mob-swatch {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.mob-brush-sizes {
  display: flex;
  gap: 4px;
}

.mob-size {
  width: 32px;
  height: 32px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}

.mob-size.active {
  border-color: var(--accent);
  color: var(--accent);
}

.mob-btn {
  width: 40px;
  height: 40px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile element picker */
#mobile-picker {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  background: var(--chrome);
  border-top: 1px solid var(--border);
  padding: 12px;
  z-index: 9;
  transition: transform 0.2s ease;
}

#mobile-picker.hidden {
  transform: translateY(100%);
  pointer-events: none;
}

#mobile-palette {
  grid-template-columns: repeat(5, 1fr);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  #sidebar {
    display: none;
  }

  #mobile-bar {
    display: flex;
  }

  #canvas-container {
    padding-bottom: 56px;
  }
}

/* Safe area for notched phones */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  #mobile-bar {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(56px + env(safe-area-inset-bottom));
  }

  #mobile-picker {
    bottom: calc(56px + env(safe-area-inset-bottom));
  }

  @media (max-width: 768px) {
    #canvas-container {
      padding-bottom: calc(56px + env(safe-area-inset-bottom));
    }
  }
}
```

**Step 3: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: add HTML shell and responsive dark CSS for desktop and mobile"
```

---

### Task 7: UI Controller

**Files:**
- Create: `js/ui.js`

**Step 1: Implement UI controller**

`js/ui.js`:

```js
import { ELEMENTS, PALETTE, EMPTY } from './elements.js';

export class UI {
  constructor(input, onPause, onClear, onSpeed) {
    this.input = input;
    this.onPause = onPause;
    this.onClear = onClear;
    this.onSpeed = onSpeed;
    this.paused = false;

    this._buildPalettes();
    this._bindDesktop();
    this._bindMobile();

    // Default to first palette element
    this.selectElement(PALETTE[0]);
  }

  _buildPalettes() {
    const desktopPalette = document.getElementById('element-palette');
    const mobilePalette = document.getElementById('mobile-palette');

    // Add eraser first
    this._addSwatch(desktopPalette, EMPTY, 'Eraser', [40, 40, 40]);
    this._addSwatch(mobilePalette, EMPTY, 'Eraser', [40, 40, 40]);

    for (const id of PALETTE) {
      const el = ELEMENTS[id];
      this._addSwatch(desktopPalette, id, el.name, el.color);
      this._addSwatch(mobilePalette, id, el.name, el.color);
    }
  }

  _addSwatch(container, elementId, name, color) {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.dataset.element = elementId;
    btn.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    btn.title = name;

    const label = document.createElement('span');
    label.className = 'swatch-label';
    label.textContent = name;
    btn.appendChild(label);

    btn.addEventListener('click', () => this.selectElement(elementId));
    container.appendChild(btn);
  }

  selectElement(id) {
    this.input.setElement(id);

    // Update all swatch highlights
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('selected', parseInt(s.dataset.element) === id);
    });

    // Update mobile swatch color
    const mobEl = document.getElementById('mob-element');
    const el = ELEMENTS[id];
    const color = id === EMPTY ? [40, 40, 40] : el.color;
    mobEl.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;

    // Close mobile picker
    document.getElementById('mobile-picker').classList.add('hidden');
  }

  _bindDesktop() {
    // Brush slider
    const slider = document.getElementById('brush-slider');
    const label = document.getElementById('brush-label');
    slider.addEventListener('input', () => {
      const size = parseInt(slider.value);
      this.input.setBrushSize(size);
      label.textContent = size;
    });

    // Speed buttons
    document.querySelectorAll('#speed-controls button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#speed-controls button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onSpeed(parseFloat(btn.dataset.speed));
      });
    });

    // Pause
    document.getElementById('btn-pause').addEventListener('click', () => this._togglePause());

    // Clear
    document.getElementById('btn-clear').addEventListener('click', () => this.onClear());
  }

  _bindMobile() {
    // Element picker toggle
    document.getElementById('mob-element').addEventListener('click', () => {
      document.getElementById('mobile-picker').classList.toggle('hidden');
    });

    // Brush sizes
    document.querySelectorAll('.mob-size').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mob-size').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.input.setBrushSize(parseInt(btn.dataset.size));
      });
    });

    // Pause
    document.getElementById('mob-pause').addEventListener('click', () => this._togglePause());

    // Clear
    document.getElementById('mob-clear').addEventListener('click', () => this.onClear());
  }

  _togglePause() {
    this.paused = !this.paused;
    this.onPause(this.paused);

    const desktopBtn = document.getElementById('btn-pause');
    const mobileBtn = document.getElementById('mob-pause');
    desktopBtn.textContent = this.paused ? 'Play' : 'Pause';
    mobileBtn.textContent = this.paused ? '▶' : '⏸';
  }
}
```

**Step 2: Commit**

```bash
git add js/ui.js
git commit -m "feat: add UI controller with palette, brush, speed, and mobile support"
```

---

### Task 8: Main Entry Point — Game Loop

**Files:**
- Create: `js/main.js`

**Step 1: Implement main game loop**

`js/main.js`:

```js
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { UI } from './ui.js';

const CELL_SIZE = 4;

class App {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.container = document.getElementById('canvas-container');

    this.speed = 1;
    this.paused = false;
    this.tickAccumulator = 0;
    this.lastTime = 0;
    this.tickInterval = 1000 / 60; // 60 ticks/sec at 1x

    this._initGrid();
    this._initUI();
    this._bindResize();

    // Start loop
    requestAnimationFrame((t) => this._loop(t));
  }

  _initGrid() {
    const rect = this.container.getBoundingClientRect();
    this.gridWidth = Math.floor(rect.width / CELL_SIZE);
    this.gridHeight = Math.floor(rect.height / CELL_SIZE);

    this.simulation = new Simulation(this.gridWidth, this.gridHeight);
    this.renderer = new Renderer(this.canvas, this.simulation.grid, CELL_SIZE);
    this.input = new InputHandler(this.canvas, this.simulation.grid, CELL_SIZE);

    // Size the canvas CSS to fill container
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  _initUI() {
    this.ui = new UI(
      this.input,
      (paused) => { this.paused = paused; },
      () => { this.simulation.grid.clear(); },
      (speed) => { this.speed = speed; }
    );
  }

  _bindResize() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this._handleResize(), 200);
    });
  }

  _handleResize() {
    const rect = this.container.getBoundingClientRect();
    const newW = Math.floor(rect.width / CELL_SIZE);
    const newH = Math.floor(rect.height / CELL_SIZE);

    if (newW === this.gridWidth && newH === this.gridHeight) return;

    // Create new simulation, copy over what fits
    const oldGrid = this.simulation.grid;
    this.gridWidth = newW;
    this.gridHeight = newH;
    this.simulation = new Simulation(newW, newH);

    const copyW = Math.min(oldGrid.width, newW);
    const copyH = Math.min(oldGrid.height, newH);
    for (let y = 0; y < copyH; y++) {
      for (let x = 0; x < copyW; x++) {
        this.simulation.grid.set(x, y, oldGrid.get(x, y));
        this.simulation.grid.setMeta(x, y, oldGrid.getMeta(x, y));
      }
    }

    this.renderer = new Renderer(this.canvas, this.simulation.grid, CELL_SIZE);
    this.input.grid = this.simulation.grid;

    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  _loop(time) {
    requestAnimationFrame((t) => this._loop(t));

    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }

    const dt = time - this.lastTime;
    this.lastTime = time;

    if (!this.paused) {
      this.tickAccumulator += dt * this.speed;
      const ticksPerFrame = Math.min(4, Math.floor(this.tickAccumulator / this.tickInterval));
      this.tickAccumulator -= ticksPerFrame * this.tickInterval;

      for (let i = 0; i < ticksPerFrame; i++) {
        this.simulation.tick();
      }
    }

    this.renderer.render();
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => new App());
```

**Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: add main entry point with game loop, resize handling, and speed control"
```

---

### Task 9: Integration Testing + Polish

**Step 1: Run all unit tests**

Run: `node --test tests/`
Expected: All pass.

**Step 2: Manual visual testing**

Serve the project and test in browser:

```bash
npx serve .
```

**Visual test checklist:**
- [ ] Sand falls and piles
- [ ] Water flows and levels
- [ ] Oil floats on water
- [ ] Fire burns wood, spreads, dies
- [ ] Gunpowder explodes near fire
- [ ] Lava + water → stone + steam
- [ ] Acid dissolves metal/stone/wood
- [ ] Plant grows near water
- [ ] Steam rises and condenses
- [ ] Smoke rises and fades
- [ ] Ice freezes nearby water
- [ ] Salt + water → saltwater
- [ ] Element selection works (desktop sidebar)
- [ ] Brush size slider works
- [ ] Speed 0.5x/1x/2x works
- [ ] Pause/play works
- [ ] Clear works
- [ ] Mobile: bottom bar visible at ≤768px
- [ ] Mobile: element picker expands/collapses
- [ ] Mobile: S/M/L brush sizes work
- [ ] Mobile: touch drawing works
- [ ] Resize preserves simulation state

**Step 3: Fix any issues found during testing**

Address bugs, tune interaction probabilities, adjust colors as needed.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: powder sim v1 — complete sandbox with 15 elements and responsive UI"
```

---

### Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Element definitions | `js/elements.js`, `tests/elements.test.js` |
| 2 | Grid core | `js/grid.js`, `tests/grid.test.js` |
| 3 | Simulation engine | `js/simulation.js`, `tests/simulation.test.js` |
| 4 | Canvas renderer | `js/renderer.js` |
| 5 | Input handling | `js/input.js` |
| 6 | HTML + CSS | `index.html`, `css/style.css` |
| 7 | UI controller | `js/ui.js` |
| 8 | Main game loop | `js/main.js` |
| 9 | Integration + polish | All files |

Total: 8 source files, 3 test files, ~1200 lines of code.
